import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma.service';
import { PaginationDto } from '../common/dto';

@Injectable()
export class ProductsService {

  // Si es true, el borrado es lógico (soft delete); si es false, es físico.
  private readonly softDelete = true;

  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({ data: createProductDto });
    return { product };
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const where = { deletedAt: null };

    const total = await this.prisma.product.count({ where });

    return {
      data: await this.prisma.product.findMany({
        where,
        take: limit,
        skip: (page! - 1) * limit!,
      }),

      metadata: {
        page,
        total,
        lastPage: Math.ceil(total / limit!),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });

    return { product };
  }

  async remove(id: number) {
    await this.findOne(id);

    if (this.softDelete) {
      const product = await this.prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return {
        deleted: true,
        method: 'soft',
        product,
      };
    }

    await this.prisma.product.delete({ where: { id } });

    return {
      deleted: true,
      method: 'physical',
      id,
    };
  }
}
