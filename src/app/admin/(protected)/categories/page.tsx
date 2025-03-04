import { Metadata } from 'next';
import CategoryManagement from './category-management';

export const metadata: Metadata = {
  title: 'Category Management - GameLab Admin',
  description: 'Manage game categories for the GameLab platform',
};

export default function CategoriesPage() {
  return <CategoryManagement />;
}
