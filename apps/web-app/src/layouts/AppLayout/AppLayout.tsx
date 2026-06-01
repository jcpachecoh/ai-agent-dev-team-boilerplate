import { Outlet } from 'react-router-dom';

import Layout from '@/components/Layout';

export default function AppLayout(): React.JSX.Element {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
