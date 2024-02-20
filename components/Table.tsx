import React from "react";
import { v4 as uuidV4 } from "uuid";
// Define the type for your data item
type DataItem = {
  [key: string]: string | number;
};

// Props for the Table component
type TableProps = {
  data: DataItem[];
};

const Table: React.FC<TableProps> = ({ data }) => {
  // Render table headers
  const renderTableHeaders = (data: DataItem[]) => {
    if (data.length === 0) return null;

    const headers = Object.keys(data[0]);
    return (
      <thead className="bg-black">
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              // Adjusted to use rem instead of px for minimum width
              className=" w-[5rem] px-6 py-3 text-left text-sm font-bold text-white uppercase tracking-wider"
            >
              {header.replace("_", " ")}
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  // Render table rows
  const renderTableRows = (data: DataItem[]) => {
    return (
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((item) => (
          <tr key={uuidV4()}>
            {Object.values(item).map((value) => (
              <td
                key={uuidV4()}
                className="w-[5rem] px-6 py-4 whitespace-nowrap text-sm text-black"
              >
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              {renderTableHeaders(data)}
              {renderTableRows(data)}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;
