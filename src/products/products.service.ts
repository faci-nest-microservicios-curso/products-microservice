import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma.service';
import { PaginationDto } from '../common/dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService {

  private readonly softDelete = true;

  constructor(private readonly prisma: PrismaService) { }

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
      throw new RpcException(
        {
          message: `product_${id}_not_found`,
          status: HttpStatus.NOT_FOUND,
        }
      );
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto
    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: data,
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

  async validateProducts(ids: number[]) {
    ids = Array.from<number>( new Set<number>())

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    if(products.length !== ids.length) {
      throw new RpcException({
        message: 'some_products_not_found',
        status: HttpStatus.BAD_REQUEST,  
      })
    }

    return products;
  }
}
