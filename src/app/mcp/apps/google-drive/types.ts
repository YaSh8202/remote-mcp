// Input types for Google Drive tools
export interface GDriveSearchInput {
	query: string;
	pageToken?: string;
	pageSize?: number;
}

export interface GDriveReadFileInput {
	fileId: string;
}

export interface GSheetsUpdateCellInput {
	fileId: string;
	range: string;
	value: string;
}

export interface GSheetsReadInput {
	spreadsheetId: string;
	ranges?: string[]; // Optional A1 notation ranges like "Sheet1!A1:B10"
	sheetId?: number; // Optional specific sheet ID
}

// Common interfaces for sheet data
export interface CellData {
	value: unknown;
	location: string;
}

export interface ProcessedSheetData {
	sheetName: string;
	data: CellData[][];
	totalRows?: number;
	totalColumns?: number;
	columnHeaders?: CellData[];
}

export interface FileContent {
	uri?: string;
	mimeType: string;
	text?: string;
	blob?: string;
}
