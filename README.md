# VSCode Tagetik

This is a VS Code extension to interact with the CCH Tagetik API.

## Features

- Query Builder to run queries and display results in a table format.
- Navigate and perform operations (select, insert, update, delete) on Tagetik tables.
- Navigate and edit functions, procedures, special methods, and datasources.

## Requirements

- Node.js
- VS Code

## Extension Settings

This extension contributes the following settings:

- `tagetik.apiUrl`: The base URL of the Tagetik API.
- `tagetik.username`: The username for Tagetik API authentication.
- `tagetik.password`: The password for Tagetik API authentication.
- `tagetik.dbEngine`: The database engine used by Tagetik (Hana, SQLServer, Postgres).
- `tagetik.queryBuilder`: Opens the Tagetik Query Builder.

### Configuring Tagetik API Settings

1. Open the Command Palette (Ctrl+Shift+P) and select `Preferences: Open Settings (UI)`.
2. Search for `Tagetik` to find the settings for the extension.
3. Set the following settings:
   - `Tagetik: Api Url`: The base URL of the Tagetik API.
   - `Tagetik: Username`: The username for Tagetik API authentication.
   - `Tagetik: Password`: The password for Tagetik API authentication.
   - `Tagetik: Db Engine`: The database engine used by Tagetik (Hana, SQLServer, Postgres).

### Making Tagetik API Calls

The extension uses the Tagetik API to fetch table columns and perform operations such as select, insert, update, and delete. The API calls are made using the Axios library.

#### Example API Call to Fetch Table Columns

```typescript
import axios from 'axios';

async function fetchTableColumns(apiUrl: string, table: string, username: string, password: string) {
    try {
        const response = await axios.get(`${apiUrl}/tables/${table}/columns`, {
            auth: {
                username: username,
                password: password
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch columns for table ${table}: ${(error as any).message}`);
        throw error;
    }
}
```

#### Example API Call to Run a Query

The `QueryBuilderPanel` can use the following function to run a query using the Tagetik API:

```typescript
import axios from 'axios';

async function runQuery(apiUrl: string, query: string, authToken: string) {
    try {
        const response = await axios.post(`${apiUrl}/runQuery`, { query }, {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to run query: ${(error as any).message}`);
        throw error;
    }
}
```

### Adding and Managing Connections

The extension allows you to add and manage connections to different Tagetik servers. You can add a new connection by clicking the plus button at the top of the tables tree. The root of each table tree is the name of the connection. You can also refresh a selected table tree or all open sessions using the refresh button.

## Known Issues

- None

## Release Notes

### 0.0.1

Initial release of VSCode Tagetik.

## Final Steps

1. **Install Dependencies**
   ```sh
   npm install
   npm install @types/vscode --save-dev
   npm install axios
   ```

2. **Compile the Extension**
   ```sh
   npm run compile
   ```

3. **Run the Extension**
   - Open the project in VS Code.
   - Press `F5` to start debugging the extension.

4. **Build and Package the Extension**
   ```sh
   npm install
   npm run compile
   vsce package
   ```

5. **Install and Test the Extension in VS Code**
   - Install the generated `.vsix` file in VS Code.
   - Test the functionality to ensure it works as expected.