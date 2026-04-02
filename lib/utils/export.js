
import * as XLSX from 'xlsx';

/**
 * Export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {String} fileName - Name of the file without extension
 */
export const exportToCSV = (data, fileName) => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // Extract headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const cell = row[header] === null || row[header] === undefined ? '' : row[header];
                // Escape quotes and wrap in quotes if contains comma
                return `"${String(cell).replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Export data to Excel (.xlsx)
 * @param {Array} data - Array of objects to export
 * @param {String} fileName - Name of the file without extension
 * @param {String} sheetName - Optional sheet name
 */
export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
