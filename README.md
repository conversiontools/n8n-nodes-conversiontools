# n8n-nodes-conversiontools

This is an n8n community node for [Conversion Tools](https://conversiontools.io) - a file conversion API that supports 100+ file formats.

[Full Documentation](https://conversiontools.io/docs/n8n) | [API Docs](https://conversiontools.io/api-documentation) | [Get API Token](https://conversiontools.io/profile)

## Features

- **40+ converters** across multiple categories:
  - Data formats: JSON, CSV, XML, Excel
  - Documents: PDF, Word, PowerPoint
  - Images: PNG, JPG, WebP, HEIC
  - OCR: Extract text from images and scanned PDFs
  - Web: Capture websites as PDF or screenshots
  - Audio/Video: MP4, MP3, WAV, MOV
  - Subtitles: SRT, VTT

- **Four operations**:
  - **Convert File**: Upload and convert a file
  - **Convert URL**: Convert websites to PDF/images
  - **Get Task Status**: Check conversion progress
  - **Download File**: Download a converted file by file ID

- **Smart features**:
  - Automatic polling for task completion
  - Binary data output for converted files
  - Sandbox mode for testing (no quota usage)

## Installation

### Community Node

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-conversiontools`
4. Click **Install**

### Manual Installation

```bash
# In your n8n installation directory
pnpm install n8n-nodes-conversiontools
```

## Credentials

1. Sign up at [conversiontools.io](https://conversiontools.io)
2. Go to your [Profile page](https://conversiontools.io/profile)
3. Copy your API token
4. In n8n, create new **Conversion Tools API** credentials
5. Paste your API token

## Usage Examples

### Convert JSON to CSV

1. Add a **Conversion Tools** node
2. Select operation: **Convert File**
3. Select converter: **JSON to CSV**
4. Set the binary property name containing your JSON file
5. Execute!

### Screenshot Website to PDF

1. Add a **Conversion Tools** node
2. Select operation: **Convert URL**
3. Select converter: **Website to PDF**
4. Enter the URL to capture
5. Execute!

### Async Conversion with Status Check

1. **Convert File** node with "Wait for Completion" disabled
2. **Get Task Status** node using the `task_id` from step 1
3. **IF** node to check if `status` equals `SUCCESS`
4. **Download File** node using the `file_id` (on SUCCESS branch)

## Sandbox Mode

Enable **Sandbox Mode** to test conversions without using your quota:

- Returns mock data in 2-5 seconds
- Does not count against your monthly limit
- Perfect for workflow development and testing

## Rate Limits

Your rate limits depend on your [subscription plan](https://conversiontools.io/pricing):

- Free: 100 conversions/month (max. 10 per day)
- Paid plans: Higher limits

## Documentation

- [n8n Integration Documentation](https://conversiontools.io/docs/n8n)
- [API Documentation](https://conversiontools.io/api-documentation)

## Support

- [Contact Support](https://conversiontools.io/contact)
- [GitHub Issues](https://github.com/conversiontools/n8n-nodes-conversiontools/issues)

## License

[MIT](LICENSE)
