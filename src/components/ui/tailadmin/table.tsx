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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900/70">
      <div className="max-w-full overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800 ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = "" }) => {
  return (
    <thead className={`bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800/60 dark:text-gray-400 ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableBodyProps> = ({ children, className = "" }) => {
  return (
    <tbody className={`divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableRowProps> = ({ children, className = "", onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.03] ${
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
        className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${className}`}
      >
        {children}
      </th>
    );
  }

  return (
    <td
      colSpan={colSpan}
      className={`whitespace-nowrap px-5 py-4 text-sm text-gray-700 dark:text-gray-300 ${className}`}
    >
      {children}
    </td>
  );
};
