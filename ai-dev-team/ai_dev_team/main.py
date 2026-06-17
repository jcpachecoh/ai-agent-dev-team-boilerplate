"""
RestOpsIQ AI Dev Team — CLI Entrypoint
Usage:
    python -m ai_dev_team            # runs current task from NEXT_TASK.md
    python -m ai_dev_team run        # same as above
    python -m ai_dev_team run tasks/03-auth.md   # run a specific task
    python -m ai_dev_team approve    # approve the pending human review
    python -m ai_dev_team status     # show last run state
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.rule import Rule

from ai_dev_team.config import get_repo_root, require_human_approval
from ai_dev_team.graph.dev_graph import create_graph
from ai_dev_team.graph.state import initial_state

app = typer.Typer(help="RestOpsIQ AI Development Team CLI")
console = Console()

# Persistent thread ID file (so approve / status can resume the same graph run)
_THREAD_FILE = Path(__file__).parent.parent / ".last_thread.json"


def _save_thread(thread_id: str, task_file: str) -> None:
    _THREAD_FILE.write_text(json.dumps({"thread_id": thread_id, "task_file": task_file}))


def _load_thread() -> dict | None:
    if _THREAD_FILE.exists():
        return json.loads(_THREAD_FILE.read_text())
    return None


def _read_next_task() -> str:
    next_task_file = get_repo_root() / "NEXT_TASK.md"
    if not next_task_file.exists():
        console.print("[red]NEXT_TASK.md not found in repo root.[/red]")
        raise typer.Exit(1)
    content = next_task_file.read_text(encoding="utf-8").strip()
    # Extract file path — it might be "tasks/01-setup.md" or wrapped in prose
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("tasks/") and line.endswith(".md"):
            return line
    console.print("[red]Could not find a task path in NEXT_TASK.md.[/red]")
    raise typer.Exit(1)


@app.command()
def run(
    task_file: Optional[str] = typer.Argument(
        None, help="Task file path relative to repo root (e.g. tasks/02-auth.md). Defaults to NEXT_TASK.md."
    ),
    thread_id: str = typer.Option("run-1", "--thread", "-t", help="Checkpoint thread ID for resumable runs."),
):
    """Run the AI dev team workflow on a task."""
    if not task_file:
        task_file = _read_next_task()

    console.print(Panel(f"[bold cyan]RestOpsIQ AI Dev Team[/bold cyan]\nTask: [yellow]{task_file}[/yellow]", expand=False))

    graph = create_graph()
    state = initial_state(task_file)
    config = {"configurable": {"thread_id": thread_id}}

    _save_thread(thread_id, task_file)

    try:
        for event in graph.stream(state, config=config, stream_mode="updates"):
            for node_name, node_output in event.items():
                console.print(Rule(f"[bold green]{node_name}[/bold green]"))

                if "messages" in node_output:
                    for msg in node_output["messages"]:
                        if hasattr(msg, "content") and msg.content:
                            console.print(Markdown(str(msg.content)))

                if "outputs" in node_output:
                    for role, output in node_output["outputs"].items():
                        if output:
                            console.print(f"[dim]({role} output captured)[/dim]")

                if node_name == "human_review":
                    console.print(
                        Panel(
                            "[bold yellow]⏸  Human Review Required[/bold yellow]\n\n"
                            "Review the architecture agent's plan above.\n\n"
                            "To approve and continue:\n"
                            f"  [cyan]python -m ai_dev_team approve --thread {thread_id}[/cyan]\n\n"
                            "To cancel: Ctrl+C",
                            title="Waiting for Approval",
                        )
                    )
                    return

                if "errors" in node_output and node_output["errors"]:
                    for err in node_output["errors"]:
                        console.print(f"[red]⚠  {err}[/red]")

    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted.[/yellow]")
        raise typer.Exit(0)

    console.print(Rule("[bold green]✅ Workflow Complete[/bold green]"))


@app.command()
def approve(
    thread_id: Optional[str] = typer.Option(None, "--thread", "-t", help="Thread ID of the paused run."),
):
    """Approve the pending human review and resume the workflow."""
    if not thread_id:
        saved = _load_thread()
        if saved:
            thread_id = saved["thread_id"]
        else:
            console.print("[red]No saved thread found. Run with --thread <id>.[/red]")
            raise typer.Exit(1)

    graph = create_graph()
    config = {"configurable": {"thread_id": thread_id}}

    # Update state to mark as approved
    graph.update_state(config, {"human_approved": True, "phase": "implementation"})
    console.print(f"[green]✓ Approved thread {thread_id}. Resuming workflow...[/green]")

    # Resume streaming
    for event in graph.stream(None, config=config, stream_mode="updates"):
        for node_name, node_output in event.items():
            console.print(Rule(f"[bold green]{node_name}[/bold green]"))
            if "messages" in node_output:
                for msg in node_output["messages"]:
                    if hasattr(msg, "content") and msg.content:
                        console.print(Markdown(str(msg.content)))

    console.print(Rule("[bold green]✅ Workflow Complete[/bold green]"))


@app.command()
def status(
    thread_id: Optional[str] = typer.Option(None, "--thread", "-t"),
):
    """Show the current state of a workflow run."""
    if not thread_id:
        saved = _load_thread()
        if saved:
            thread_id = saved["thread_id"]
            console.print(f"[dim]Using saved thread: {thread_id} (task: {saved.get('task_file')})[/dim]")
        else:
            console.print("[red]No saved thread found.[/red]")
            raise typer.Exit(1)

    graph = create_graph()
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = graph.get_state(config)

    if not snapshot:
        console.print("[yellow]No state found for this thread.[/yellow]")
        return

    state = snapshot.values
    console.print(Panel(
        f"Phase:          [cyan]{state.get('phase', 'unknown')}[/cyan]\n"
        f"Current agent:  [cyan]{state.get('current_agent', '—')}[/cyan]\n"
        f"Task file:      [yellow]{state.get('task_file', '—')}[/yellow]\n"
        f"Iteration:      {state.get('iteration', 0)}\n"
        f"Human approved: {'[green]Yes[/green]' if state.get('human_approved') else '[yellow]No[/yellow]'}\n"
        f"Tests passing:  {'[green]Yes[/green]' if state.get('tests_passing') else '[red]No[/red]'}\n"
        f"Files written:  {len(state.get('files_written', []))}\n"
        f"Errors:         {len(state.get('errors', []))}",
        title=f"Workflow Status — Thread: {thread_id}",
    ))

    if state.get("errors"):
        console.print("[red]Errors:[/red]")
        for e in state["errors"]:
            console.print(f"  • {e}")


def main():
    app()


if __name__ == "__main__":
    main()
