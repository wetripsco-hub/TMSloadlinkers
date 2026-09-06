import React, { ReactNode } from "react";

export interface TableProps {
  children: ReactNode;
  className?: string;
}

export interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
}

export const Table: React.FC<TableProps> = ({ children, className = "" }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="max-w-full overflow-x-auto">
        <table className={`min-w-full divide-y divide-slate-200 text-left text-sm ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = "" }) => {
  return (
    <thead className={`border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableBodyProps> = ({ children, className = "" }) => {
  return (
    <tbody className={`divide-y divide-slate-100 bg-white ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableRowProps> = ({ children, className = "", onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-slate-50/80 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = "",
  colSpan,
}) => {
  if (isHeader) {
    return (
      <th
        colSpan={colSpan}
        className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}
      >
        {children}
      </th>
    );
  }

  return (
    <td
      colSpan={colSpan}
      className={`whitespace-nowrap px-5 py-4 text-sm text-slate-700 ${className}`}
    >
      {children}
    </td>
  );
};

export default Table;
