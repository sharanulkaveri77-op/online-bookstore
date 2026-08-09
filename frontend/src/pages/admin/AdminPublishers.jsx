import CrudTable from './CrudTable';

export default function AdminPublishers() {
  return (
    <CrudTable
      resource="publishers"
      title="Publishers"
      create="publisher"
      load="/admin/publishers"
      fields={[{ key: 'name', header: 'Name' }]}
    />
  );
}
