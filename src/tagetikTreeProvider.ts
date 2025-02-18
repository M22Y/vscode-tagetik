import * as vscode from 'vscode';
import axios from 'axios';

export class TagetikTreeProvider implements vscode.TreeDataProvider<TagetikItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TagetikItem | undefined | void> = new vscode.EventEmitter<TagetikItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TagetikItem | undefined | void> = this._onDidChangeTreeData.event;

    private connections: { [key: string]: { apiUrl: string, authToken: string } } = {};

    constructor() {
        this.loadConnections();
    }

    getTreeItem(element: TagetikItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TagetikItem): Promise<TagetikItem[]> {
        if (element) {
            if (element.contextValue === 'connection') {
                return this.getTables(element.label);
            } else {
                if (element.connectionName) {
                    return this.getOperations(element.label, element.connectionName);
                } else {
                    vscode.window.showErrorMessage('Connection name is undefined');
                    return [];
                }
            }
        } else {
            return this.getConnections();
        }
    }

    private async getConnections(): Promise<TagetikItem[]> {
        return Object.keys(this.connections).map(connectionName => 
            new TagetikItem(connectionName, vscode.TreeItemCollapsibleState.Collapsed, 'connection')
        );
    }

    private async getTables(connectionName: string): Promise<TagetikItem[]> {
        const connection = this.connections[connectionName];
        try {
            const response = await axios.get(`${connection.apiUrl}/tables`, {
                headers: {
                    Authorization: `Bearer ${connection.authToken}`
                }
            });
            return response.data.map((table: any) => new TagetikItem(table.name, vscode.TreeItemCollapsibleState.Collapsed, 'table', connectionName));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to fetch tables from Tagetik API for connection ${connectionName}`);
            return [];
        }
    }

    private getOperations(tableName: string, connectionName: string): TagetikItem[] {
        return [
            new TagetikItem('Select', vscode.TreeItemCollapsibleState.None, 'operation', connectionName, {
                command: 'tagetik.selectTable',
                title: 'Select',
                arguments: [tableName, connectionName]
            }),
            new TagetikItem('Insert', vscode.TreeItemCollapsibleState.None, 'operation', connectionName, {
                command: 'tagetik.insertTable',
                title: 'Insert',
                arguments: [tableName, connectionName]
            }),
            new TagetikItem('Update', vscode.TreeItemCollapsibleState.None, 'operation', connectionName, {
                command: 'tagetik.updateTable',
                title: 'Update',
                arguments: [tableName, connectionName]
            }),
            new TagetikItem('Delete', vscode.TreeItemCollapsibleState.None, 'operation', connectionName, {
                command: 'tagetik.deleteTable',
                title: 'Delete',
                arguments: [tableName, connectionName]
            })
        ];
    }

    private loadConnections() {
        const config = vscode.workspace.getConfiguration('tagetik');
        const connections = config.get<{ [key: string]: { apiUrl: string, authToken: string } }>('connections') || {};
        this.connections = connections;
    }

    private saveConnections() {
        const config = vscode.workspace.getConfiguration('tagetik');
        config.update('connections', this.connections, vscode.ConfigurationTarget.Global);
    }

    public async addConnection() {
        const apiUrl = await vscode.window.showInputBox({ prompt: 'Enter the API URL' });
        const username = await vscode.window.showInputBox({ prompt: 'Enter the username' });
        const password = await vscode.window.showInputBox({ prompt: 'Enter the password', password: true });

        if (apiUrl && username && password) {
            try {
                const response = await axios.post(`${apiUrl}/authenticate`, { username, password });
                const authToken = response.data.token;
                const connectionName = await vscode.window.showInputBox({ prompt: 'Enter a name for this connection' });

                if (connectionName) {
                    this.connections[connectionName] = { apiUrl, authToken };
                    this.saveConnections();
                    this._onDidChangeTreeData.fire();
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to authenticate with Tagetik API: ${(error as any).message}`);
            }
        }
    }

    public refresh(element?: TagetikItem) {
        if (element) {
            if (element.contextValue === 'connection') {
                this._onDidChangeTreeData.fire(element);
            } else {
                const connectionName = element.connectionName;
                if (connectionName) {
                    this._onDidChangeTreeData.fire(new TagetikItem(connectionName, vscode.TreeItemCollapsibleState.Collapsed, 'connection'));
                }
            }
        } else {
            this._onDidChangeTreeData.fire();
        }
    }
}

class TagetikItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly connectionName?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        this.command = command;
    }
}