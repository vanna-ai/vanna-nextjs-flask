import React from "react";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

// Define the data type
type DataItem = Record<string, any>;

interface TableProps {
  dataString: string;
}

const Table: React.FC<TableProps> = ({ dataString }) => {
  const data: DataItem[] = JSON.parse(dataString);

  // Define columns based on data keys
  const columns: ColumnDef<DataItem>[] = React.useMemo(() => {
    if (data.length === 0) return [];
    const firstItemKeys = Object.keys(data[0]);
    return firstItemKeys.map((key) => ({
      accessorKey: key, // Use the key from the data as accessor
      header: () => key.replace("_", " ").toUpperCase(), // Customize the header
      cell: (info) => info.getValue(), // Access cell value
    }));
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-scroll min-w-[50rem] max-w-[70rem] border-gray-200 shadow rounded-md">
      <table className="min-w-full divide-y divide-gray-200 p-4">
        <thead className="rounded">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-black">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
