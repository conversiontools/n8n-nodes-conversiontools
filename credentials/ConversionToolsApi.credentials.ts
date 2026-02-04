import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ConversionToolsApi implements ICredentialType {
	name = 'conversionToolsApi';

	displayName = 'Conversion Tools API';

	documentationUrl = 'https://conversiontools.io/api-documentation';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'API Token from your Conversion Tools profile. Get it at <a href="https://conversiontools.io/profile" target="_blank">conversiontools.io/profile</a>',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
				'User-Agent': 'conversiontools-n8n/1.0.0',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.conversiontools.io/v1',
			url: '/auth',
		},
	};
}
