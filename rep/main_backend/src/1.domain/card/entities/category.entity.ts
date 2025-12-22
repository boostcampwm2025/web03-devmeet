import { idVo } from '@domain/shared';
import { categoryNameVo, CategoryProps } from '../vo/category.vo';

export class Category {
  private readonly id: CategoryProps['id'];
  private readonly name: CategoryProps['name'];
  private readonly created_at: Exclude<CategoryProps['created_at'], undefined>;
  private readonly updated_at: Exclude<CategoryProps['updated_at'], undefined>;

  constructor({
    id,
    name,
    created_at = new Date(),
    updated_at = new Date(),
  }: CategoryProps) {
    this.id = idVo(id);
    this.name = categoryNameVo(name);
    this.created_at =
      created_at && created_at instanceof Date ? created_at : new Date();
    this.updated_at =
      updated_at && updated_at instanceof Date ? updated_at : new Date();
  }

  getId(): CategoryProps['id'] {
    return this.id;
  }
  getName(): CategoryProps['name'] {
    return this.name;
  }
  getCreatedAt(): Exclude<CategoryProps['created_at'], undefined> {
    return this.created_at;
  }
  getUpdatedAt(): Exclude<CategoryProps['updated_at'], undefined> {
    return this.updated_at;
  }

  getData(): Required<CategoryProps> {
    return {
      id: this.id,
      name: this.name,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
