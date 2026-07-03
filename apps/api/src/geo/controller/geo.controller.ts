import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { GeoService } from '../service/geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly service: GeoService) {}

  @Public()
  @ApiOperation({ summary: 'Listar departamentos de Colombia' })
  @Get('departamentos')
  getDepartments() {
    return this.service.listDepartments();
  }

  @Public()
  @ApiOperation({ summary: 'Listar ciudades por departamento' })
  @Get('ciudades')
  getCities(@Query('departamento') departamento: string) {
    return this.service.listCities(departamento ?? '');
  }
}
