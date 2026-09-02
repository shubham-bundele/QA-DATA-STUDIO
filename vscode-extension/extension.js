const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

async function activate(context) {
    console.log('QA Data Studio extension activated');

    let disposable = vscode.commands.registerCommand('qa-data-studio.generateScript', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const htmlContent = editor.document.getText(selection);

        if (!htmlContent) {
            vscode.window.showErrorMessage('Please select some HTML to generate a script.');
            return;
        }

        const config = vscode.workspace.getConfiguration('qaDataStudio');
        const backendUrl = config.get('backendUrl') || 'https://qa-data-studio.vercel.app';
        const framework = config.get('framework') || 'Playwright POM (TypeScript)';

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "QA Data Studio: Generating Script...",
            cancellable: false
        }, async (progress) => {
            try {
                // Dynamically import node-fetch as it's not bundled natively in commonjs 
                // but we can use VS Code's fetch or standard https. For simplicity, we use native fetch 
                // in Node 18+ (VS Code includes it)
                const fetch = global.fetch; 

                const response = await fetch(`${backendUrl}/api/build-automation-interactive`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        framework: framework,
                        messages: [
                            { role: "user", content: "Generate a script using this HTML:\n\n" + htmlContent }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error("Backend returned status: " + response.status);
                }

                const data = await response.json();
                let aiResponse = data.content;

                const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    const files = JSON.parse(jsonMatch[1]);
                    
                    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
                    
                    if (!workspaceFolder) {
                        vscode.window.showErrorMessage('Please open a workspace to save generated files.');
                        return;
                    }

                    for (const file of files) {
                        const filePath = path.join(workspaceFolder, file.filename);
                        const dirPath = path.dirname(filePath);
                        
                        if (!fs.existsSync(dirPath)) {
                            fs.mkdirSync(dirPath, { recursive: true });
                        }

                        fs.writeFileSync(filePath, file.content, 'utf8');
                        
                        // Open the file in editor
                        const doc = await vscode.workspace.openTextDocument(filePath);
                        await vscode.window.showTextDocument(doc, { preview: false });
                    }
                    
                    vscode.window.showInformationMessage(`Successfully generated ${files.length} file(s)!`);
                } else {
                    vscode.window.showWarningMessage("The AI needed more context. Try providing more HTML or instructions.");
                }

            } catch (error) {
                vscode.window.showErrorMessage("Error contacting QA Data Studio: " + error.message);
            }
        });
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
