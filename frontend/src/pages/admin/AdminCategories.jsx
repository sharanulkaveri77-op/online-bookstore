import CrudTable from './CrudTable';

export default function AdminCategories() {
  return (
    <CrudTable
      resource="categories"
      title="Categories"
      create="category"
      load="/admin/categories"
      fields={[{ key: 'name', header: 'Name' }]}
    />
  );
}
