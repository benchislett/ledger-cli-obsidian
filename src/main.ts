import './styles.css'

import { App, TextFileView, TFile, ViewState, WorkspaceLeaf, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, FileSystemAdapter } from 'obsidian';
import React from 'react';
import { Dashboard } from './ui/dash';
import { invoke_ledger } from './invoke_ledger_cli';

import { createRoot } from 'react-dom/client';

export class LedgerView extends TextFileView {
	private readonly plugin: MyPlugin;
	private currentFilePath: string | null;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.currentFilePath = null;

		this.addAction('pencil', 'Switch to Markdown View', () => {
			const state = leaf.view.getState();
			leaf.setViewState(
				{
					type: 'markdown',
					state,
					popstate: true,
				} as ViewState,
				{ focus: true },
			);
		});

		this.redraw();
	}

	public canAcceptExtension(extension: string): boolean {
		return extension === 'ledger';
	}

	public getViewType(): string {
		return "ledger";
	}

	public getDisplayText(): string {
		return 'Ledger';
	}

	public getIcon(): string {
		return 'ledger';
	}

	public getViewData(): string {
		console.debug('Ledger: returning view data');
		return this.data;
	}

	public setViewData(data: string, clear: boolean): void {
		console.debug('Ledger: setting view data');
	}

	public clear(): void {
		console.debug('Ledger: clearing view');
	}

	public onload(): void {
		console.debug('Ledger: loading dashboard');
	}

	public onunload(): void {
		console.debug('Ledger: unloading dashboard');
	}

	public async onLoadFile(file: TFile): Promise<void> {
		console.debug('Ledger: File being loaded: ' + file.path);

		// if (this.currentFilePath !== file.path) {
		this.currentFilePath = file.path;
		this.redraw();
		// }
	}

	public async onUnloadFile(file: TFile): Promise<void> {
		console.debug('Ledger: File being unloaded: ' + file.path);
	}

	public readonly redraw = (): void => {
		console.debug('Ledger: Creating dashboard view');

		const contentEl = this.containerEl.children[1];

		if (this.currentFilePath) {
			console.debug('Ledger: Dashboard file is available');
			const root = createRoot(contentEl!);
			// contentEl.setAttribute('style', 'overflow: hidden');
			root.render(React.createElement(Dashboard, { exePath: this.plugin.settings.ledgerPath, filePath: this.plugin.rootPath() + "/" + this.currentFilePath }));
		} else {
			console.debug("Ledger: Dashboard view doesn't have a file yet");
			contentEl.empty();
			const span = contentEl.createSpan();
			span.setText('Loading...');
		}
	};
}


// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	ledgerPath: string;
	ledgerFile: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	ledgerPath: '/bin/ledger',
	ledgerFile: 'transactions.ledger',
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	rootPath(): string | null {
		let adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			return adapter.getBasePath();
		}
		return null;
	}

	currentFile(abspath: boolean = true): string | null {
		const file = this.app.workspace.getActiveFile()?.path;
		if (file && abspath) {
			const root = this.rootPath();
			return root ? root + "/" + file : null;
		}
		return file || null;
	}

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', async (evt: MouseEvent) => {
			const file = this.currentFile();

			if (file && file.endsWith(".ledger")) {
				new Notice(`Ledger path: ${this.settings.ledgerPath}`);
				const output = await invoke_ledger(this.settings.ledgerPath, file, ["--version"]);
				new Notice(output);
			} else {
				if (!file) {
					new Notice(`Open a ledger file`);
				} else {
					new Notice(`Not a ledger file: ${this.currentFile(false)}`);
				}
			}
			// Called when the user clicks the icon.
			// new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerView("ledger", (leaf) => new LedgerView(leaf, this));

		this.registerExtensions(['ledger'], "ledger");

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Ledger CLI Executable Path')
			.setDesc('Path to the ledger CLI executable. Must be installed on your system for this plugin to work. You can locate it by running "which ledger" in your terminal.')
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.ledgerPath)
				.setValue(this.plugin.settings.ledgerPath)
				.onChange(async (value) => {
					this.plugin.settings.ledgerPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Ledger Transaction File')
			.setDesc('Path to the ledger transaction file. This file will be used to generate the ledger dashboard.')
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.ledgerFile)
				.setValue(this.plugin.settings.ledgerFile)
				.onChange(async (value) => {
					this.plugin.settings.ledgerFile = value;
					await this.plugin.saveSettings();
				}));
	}
}
