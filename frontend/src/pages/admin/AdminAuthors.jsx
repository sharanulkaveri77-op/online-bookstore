import CrudTable from './CrudTable';

export default function AdminAuthors() {
  return (
    <CrudTable
      resource="authors"
      title="Authors"
      create="author"
      load="/admin/authors"
      fields={[
        { key: 'name', header: 'Name' },
        { key: 'bio', header: 'Bio', textarea: true, truncate: true }
      ]}
    />
  );
}
