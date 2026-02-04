import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Readable } from 'stream';

import { CONVERTERS, type ConverterInfo } from './converters';

const BASE_URL = 'https://api.conversiontools.io/v1';

export class ConversionTools implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Conversion Tools',
		name: 'conversionTools',
		icon: 'file:conversiontools.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["converter"] ? $parameter["operation"] + ": " + $parameter["converter"] : $parameter["operation"]}}',
		description: 'Convert files between 100+ formats using Conversion Tools API',
		defaults: {
			name: 'Conversion Tools',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		credentials: [
			{
				name: 'conversionToolsApi',
				required: true,
			},
		],
		properties: [
			// Operation
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Convert File',
						value: 'convertFile',
						description: 'Upload a file and convert it to another format',
						action: 'Convert a file',
					},
					{
						name: 'Convert URL',
						value: 'convertUrl',
						description: 'Convert a file from URL (for website screenshots)',
						action: 'Convert a URL',
					},
					{
						name: 'Get Task Status',
						value: 'getTaskStatus',
						description: 'Get the status of a conversion task',
						action: 'Get task status',
					},
					{
						name: 'Download File',
						value: 'downloadFile',
						description: 'Download a converted file by file ID',
						action: 'Download a file',
					},
				],
				default: 'convertFile',
			},
			// Converter Selection
			{
				displayName: 'Converter',
				name: 'converter',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['convertFile'],
					},
				},
				options: CONVERTERS.filter((c) => !c.type.includes('website')).map(
					(converter: ConverterInfo) => ({
						name: converter.name,
						value: converter.type,
						description: converter.description,
					})
				),
				default: 'convert.json_to_csv',
				description: 'Select the conversion type',
			},
			// URL Converter Selection
			{
				displayName: 'Converter',
				name: 'converter',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['convertUrl'],
					},
				},
				options: CONVERTERS.filter((c) => c.type.includes('website')).map(
					(converter: ConverterInfo) => ({
						name: converter.name,
						value: converter.type,
						description: converter.description,
					})
				),
				default: 'convert.website_to_pdf',
				description: 'Select the conversion type',
			},
			// Input File (Binary)
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['convertFile'],
					},
				},
				description: 'Name of the binary property containing the file to convert',
			},
			// URL Input
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['convertUrl'],
					},
				},
				placeholder: 'https://example.com',
				description: 'URL to convert (for website to PDF/image conversions)',
			},
			// Task ID for status check
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getTaskStatus'],
					},
				},
				description: 'The task ID to check status for',
			},
			// File ID for download
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['downloadFile'],
					},
				},
				description: 'The file ID to download (from task status response)',
			},
			// Wait for completion
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['convertFile', 'convertUrl'],
					},
				},
				description:
					'Whether to wait for the conversion to complete before continuing',
			},
			// Polling options
			{
				displayName: 'Polling Interval (seconds)',
				name: 'pollingInterval',
				type: 'number',
				default: 5,
				displayOptions: {
					show: {
						operation: ['convertFile', 'convertUrl'],
						waitForCompletion: [true],
					},
				},
				description: 'How often to check for task completion (in seconds)',
			},
			// Max wait time
			{
				displayName: 'Max Wait Time (seconds)',
				name: 'maxWaitTime',
				type: 'number',
				default: 300,
				displayOptions: {
					show: {
						operation: ['convertFile', 'convertUrl'],
						waitForCompletion: [true],
					},
				},
				description: 'Maximum time to wait for conversion (in seconds)',
			},
			// Sandbox mode
			{
				displayName: 'Sandbox Mode',
				name: 'sandbox',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['convertFile', 'convertUrl'],
					},
				},
				description:
					"Whether to use sandbox mode for testing (doesn't count against quota)",
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'convertFile') {
					const result = await executeConvertFile.call(this, i);
					returnData.push(result);
				} else if (operation === 'convertUrl') {
					const result = await executeConvertUrl.call(this, i);
					returnData.push(result);
				} else if (operation === 'getTaskStatus') {
					const result = await executeGetTaskStatus.call(this, i);
					returnData.push(result);
				} else if (operation === 'downloadFile') {
					const result = await executeDownloadFile.call(this, i);
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

async function executeConvertFile(
	this: IExecuteFunctions,
	itemIndex: number
): Promise<INodeExecutionData> {
	const converter = this.getNodeParameter('converter', itemIndex) as string;
	const binaryPropertyName = this.getNodeParameter(
		'binaryPropertyName',
		itemIndex
	) as string;
	const waitForCompletion = this.getNodeParameter(
		'waitForCompletion',
		itemIndex
	) as boolean;
	const sandbox = this.getNodeParameter('sandbox', itemIndex) as boolean;

	// Get binary data
	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	if (!binaryData.fileName) {
		throw new NodeOperationError(this.getNode(), 'No file name given for input file.', { itemIndex });
	}

	// Step 1: Upload file using native FormData and Blob
	const FormDataCtor = (globalThis as any).FormData;
	const BlobCtor = (globalThis as any).Blob;
	const formData = new FormDataCtor();

	const blob = new BlobCtor([buffer], { type: binaryData.mimeType || 'application/octet-stream' });
	formData.append('file', blob, binaryData.fileName);

	const uploadResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'conversionToolsApi',
		{
			method: 'POST',
			url: `${BASE_URL}/files`,
			body: formData,
		}
	);

	if (uploadResponse.error) {
		throw new NodeOperationError(
			this.getNode(),
			`Upload failed: ${uploadResponse.error}`,
			{ itemIndex }
		);
	}

	const fileId = uploadResponse.file_id;

	// Step 2: Create task
	const taskOptions: IDataObject = {
		file_id: fileId,
	};

	if (sandbox) {
		taskOptions.sandbox = true;
	}

	const taskResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'conversionToolsApi',
		{
			method: 'POST',
			url: `${BASE_URL}/tasks`,
			body: {
				type: converter,
				options: taskOptions,
			},
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);

	if (taskResponse.error) {
		throw new NodeOperationError(
			this.getNode(),
			`Task creation failed: ${taskResponse.error}`,
			{ itemIndex }
		);
	}

	const taskId = taskResponse.task_id;

	// Step 3: Wait for completion if requested
	if (waitForCompletion) {
		const pollingInterval =
			(this.getNodeParameter('pollingInterval', itemIndex) as number) * 1000;
		const maxWaitTime =
			(this.getNodeParameter('maxWaitTime', itemIndex) as number) * 1000;

		const result = await waitForTask.call(
			this,
			taskId,
			pollingInterval,
			maxWaitTime,
			itemIndex
		);

		// Download the result file if successful
		if (result.status === 'SUCCESS' && result.file_id) {
			const downloadResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'conversionToolsApi',
				{
					method: 'GET',
					url: `${BASE_URL}/files/${result.file_id}`,
					returnFullResponse: true,
					encoding: 'stream',
				}
			) as { body: Readable; headers: { [key: string]: string } };

			const converterInfo = CONVERTERS.find((c) => c.type === converter);
			const outputFormat = converterInfo?.outputFormat || 'bin';

			return {
				json: {
					task_id: taskId,
					status: result.status,
					file_id: result.file_id,
					converter,
					sandbox,
				},
				binary: {
					data: await this.helpers.prepareBinaryData(
						downloadResponse.body,
						`converted.${outputFormat}`,
						downloadResponse.headers['content-type']
					),
				},
				pairedItem: { item: itemIndex },
			};
		}

		return {
			json: {
				task_id: taskId,
				...result,
				converter,
				sandbox,
			},
			pairedItem: { item: itemIndex },
		};
	}

	// Return immediately without waiting
	return {
		json: {
			task_id: taskId,
			status: 'PENDING',
			converter,
			sandbox,
			message: 'Task created. Use "Get Task Status" to check progress.',
		},
		pairedItem: { item: itemIndex },
	};
}

async function executeConvertUrl(
	this: IExecuteFunctions,
	itemIndex: number
): Promise<INodeExecutionData> {
	const converter = this.getNodeParameter('converter', itemIndex) as string;
	const url = this.getNodeParameter('url', itemIndex) as string;
	const waitForCompletion = this.getNodeParameter(
		'waitForCompletion',
		itemIndex
	) as boolean;
	const sandbox = this.getNodeParameter('sandbox', itemIndex) as boolean;

	// Create task with URL
	const taskOptions: IDataObject = {
		url,
	};

	if (sandbox) {
		taskOptions.sandbox = true;
	}

	const taskResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'conversionToolsApi',
		{
			method: 'POST',
			url: `${BASE_URL}/tasks`,
			body: {
				type: converter,
				options: taskOptions,
			},
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);

	if (taskResponse.error) {
		throw new NodeOperationError(
			this.getNode(),
			`Task creation failed: ${taskResponse.error}`,
			{ itemIndex }
		);
	}

	const taskId = taskResponse.task_id;

	// Wait for completion if requested
	if (waitForCompletion) {
		const pollingInterval =
			(this.getNodeParameter('pollingInterval', itemIndex) as number) * 1000;
		const maxWaitTime =
			(this.getNodeParameter('maxWaitTime', itemIndex) as number) * 1000;

		const result = await waitForTask.call(
			this,
			taskId,
			pollingInterval,
			maxWaitTime,
			itemIndex
		);

		// Download the result file if successful
		if (result.status === 'SUCCESS' && result.file_id) {
			const downloadResponse = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'conversionToolsApi',
				{
					method: 'GET',
					url: `${BASE_URL}/files/${result.file_id}`,
					returnFullResponse: true,
					encoding: 'stream',
				}
			) as { body: Readable; headers: { [key: string]: string } };

			const converterInfo = CONVERTERS.find((c) => c.type === converter);
			const outputFormat = converterInfo?.outputFormat || 'bin';

			return {
				json: {
					task_id: taskId,
					status: result.status,
					file_id: result.file_id,
					converter,
					url,
					sandbox,
				},
				binary: {
					data: await this.helpers.prepareBinaryData(
						downloadResponse.body,
						`converted.${outputFormat}`,
						downloadResponse.headers['content-type']
					),
				},
				pairedItem: { item: itemIndex },
			};
		}

		return {
			json: {
				task_id: taskId,
				...result,
				converter,
				url,
				sandbox,
			},
			pairedItem: { item: itemIndex },
		};
	}

	return {
		json: {
			task_id: taskId,
			status: 'PENDING',
			converter,
			url,
			sandbox,
			message: 'Task created. Use "Get Task Status" to check progress.',
		},
		pairedItem: { item: itemIndex },
	};
}

async function executeGetTaskStatus(
	this: IExecuteFunctions,
	itemIndex: number
): Promise<INodeExecutionData> {
	const taskId = this.getNodeParameter('taskId', itemIndex) as string;

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'conversionToolsApi',
		{
			method: 'GET',
			url: `${BASE_URL}/tasks/${taskId}`,
		}
	);

	if (response.error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to get task status: ${response.error}`,
			{ itemIndex }
		);
	}

	return {
		json: {
			task_id: taskId,
			status: response.status,
			file_id: response.file_id,
			error: response.error,
			conversionProgress: response.conversionProgress,
		},
		pairedItem: { item: itemIndex },
	};
}

async function waitForTask(
	this: IExecuteFunctions,
	taskId: string,
	pollingInterval: number,
	maxWaitTime: number,
	itemIndex: number
): Promise<IDataObject> {
	const startTime = Date.now();

	while (Date.now() - startTime < maxWaitTime) {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'conversionToolsApi',
			{
				method: 'GET',
				url: `${BASE_URL}/tasks/${taskId}`,
			}
		);

		if (response.status === 'SUCCESS' || response.status === 'ERROR') {
			return response as IDataObject;
		}

		// Wait before polling again
		await new Promise((resolve) => setTimeout(resolve, pollingInterval));
	}

	throw new NodeOperationError(
		this.getNode(),
		`Conversion timed out after ${maxWaitTime / 1000} seconds`,
		{ itemIndex }
	);
}

async function executeDownloadFile(
	this: IExecuteFunctions,
	itemIndex: number
): Promise<INodeExecutionData> {
	const fileId = this.getNodeParameter('fileId', itemIndex) as string;

	const downloadResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'conversionToolsApi',
		{
			method: 'GET',
			url: `${BASE_URL}/files/${fileId}`,
			returnFullResponse: true,
			encoding: 'stream',
		}
	) as { body: Readable; headers: { [key: string]: string } };

	// Extract filename from content-disposition header or use default
	const contentDisposition = downloadResponse.headers['content-disposition'] || '';
	const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
	const filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : 'downloaded_file';

	return {
		json: {
			file_id: fileId,
			filename,
		},
		binary: {
			data: await this.helpers.prepareBinaryData(
				downloadResponse.body,
				filename,
				downloadResponse.headers['content-type']
			),
		},
		pairedItem: { item: itemIndex },
	};
}
