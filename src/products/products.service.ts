import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma.service';
import { PaginationDto } from '../common/dto';

@Injectable()
export class ProductsService {

  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({data: createProductDto})
    return {product}
  }

  async findAll(paginationDto: PaginationDto) {
    const {page, limit} = paginationDto
    
    const total = await this.prisma.product.count()
    
    return {
      data: await this.prisma.product.findMany({
        take: limit,
        skip: (page!  - 1) * limit!
      }),

      metadata: {
        page,
        total,
        lastPage: Math.ceil(total / limit!)
      }
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
