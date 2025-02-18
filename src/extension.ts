import * as vscode from 'vscode';
import axios from 'axios';
import { QueryBuilderPanel } from './queryBuilderPanel';
import { TagetikTreeProvider } from './tagetikTreeProvider';

let authToken: string | null = null;

export function activate(context: vscode.ExtensionContext) {
    const tagetikTreeProvider = new TagetikTreeProvider();
    vscode.window.registerTreeDataProvider('tagetikTables', tagetikTreeProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('tagetik.queryBuilder', () => {
            QueryBuilderPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('tagetik.selectTable', (table: string, connectionName: string) => {
            executeQuery('select', table, connectionName);
        }),
        vscode.commands.registerCommand('tagetik.insertTable', (table: string, connectionName: string) => {
            executeQuery('insert', table, connectionName);
        }),
        vscode.commands.registerCommand('tagetik.updateTable', (table: string, connectionName: string) => {
            executeQuery('update', table, connectionName);
        }),
        vscode.commands.registerCommand('tagetik.deleteTable', (table: string, connectionName: string) => {
            executeQuery('delete', table, connectionName);
        }),
        vscode.commands.registerCommand('tagetik.runQuery', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const query = editor.document.getText();
                await runQuery(query);
            }
        }),
        vscode.commands.registerCommand('tagetik.addConnection', async () => {
            await tagetikTreeProvider.addConnection();
        }),
        vscode.commands.registerCommand('tagetik.refresh', (element: any) => {
            tagetikTreeProvider.refresh(element);
        })
    );

    // Access Tagetik API settings
    const config = vscode.workspace.getConfiguration('tagetik');
    const apiUrl = config.get<string>('apiUrl');
    const username = config.get<string>('username');
    const password = config.get<string>('password');

    // Authenticate with the Tagetik API and save the token
    authenticate(apiUrl, username, password);
}

export function deactivate() {}

async function authenticate(apiUrl: string, username: string, password: string) {
    try {
        const response = await axios.post(`${apiUrl}/authenticate`, { username, password });
        authToken = response.data.token;
    } catch (error) {
        const errorMessage = (error as any).message;
        vscode.window.showErrorMessage(`Failed to authenticate with Tagetik API: ${errorMessage}`);
    }
}

async function executeQuery(operation: string, table: string, connectionName: string) {
    const config = vscode.workspace.getConfiguration('tagetik');
    const dbEngine = config.get<string>('dbEngine');
    const apiUrl = config.get<string>('apiUrl');

    try {
        const response = await axios.get(`${apiUrl}/tables/${table}/columns`, {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        });
        const columns = response.data;

        let query = '';
        switch (operation) {
            case 'select':
                query = generateSelectQuery(dbEngine, table, columns);
                break;
            case 'insert':
                query = generateInsertQuery(dbEngine, table, columns);
                break;
            case 'update':
                query = generateUpdateQuery(dbEngine, table, columns);
                break;
            case 'delete':
                query = generateDeleteQuery(dbEngine, table, columns);
                break;
        }

        QueryBuilderPanel.createOrShow(vscode.Uri.parse(''));
        QueryBuilderPanel.currentPanel?.setQuery(query);
    } catch (error) {
        const errorMessage = (error as any).message;
        vscode.window.showErrorMessage(`Failed to fetch columns for table ${table}: ${errorMessage}`);
    }
}

function generateSelectQuery(dbEngine: string | undefined, table: string, columns: any[]): string {
    const columnList = columns.map(col => col.name).join(', ');
    switch (dbEngine) {
        case 'Hana':
            return `SELECT ${columnList} FROM ${table} LIMIT 50;`;
        case 'SQLServer':
            return `SELECT TOP 50 ${columnList} FROM ${table};`;
        case 'Postgres':
            return `SELECT ${columnList} FROM ${table} LIMIT 50;`;
        default:
            return `SELECT ${columnList} FROM ${table} LIMIT 50;`;
    }
}

function generateInsertQuery(dbEngine: string | undefined, table: string, columns: any[]): string {
    const columnList = columns.map(col => col.name).join(', ');
    const valueList = columns.map(col => `:${col.name}`).join(', ');
    return `INSERT INTO ${table} (${columnList}) VALUES (${valueList});`;
}

function generateUpdateQuery(dbEngine: string | undefined, table: string, columns: any[]): string {
    const setClause = columns.map(col => `${col.name} = :${col.name}`).join(', ');
    return `UPDATE ${table} SET ${setClause} WHERE condition;`;
}

function generateDeleteQuery(dbEngine: string | undefined, table: string, columns: any[]): string {
    return `DELETE FROM ${table} WHERE condition;`;
}

async function runQuery(query: string) {
    const config = vscode.workspace.getConfiguration('tagetik');
    const apiUrl = config.get<string>('apiUrl');

    try {
        const response = await axios.post(`${apiUrl}/runQuery`, { query }, {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        });
        const results = response.data;
        QueryBuilderPanel.currentPanel?.setResults(results);
        vscode.window.showInformationMessage('Query executed successfully');
    } catch (error) {
        const errorMessage = (error as any).message;
        vscode.window.showErrorMessage(`Failed to execute query: ${errorMessage}`);
    }
}