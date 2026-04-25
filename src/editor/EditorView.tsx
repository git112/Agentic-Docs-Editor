import React, { useMemo, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { DocumentModel } from '../core/documentModel';
import { EditorBridge } from '../core/editorBridge';
import DebugPanel from '../debug/DebugPanel';
import AgentControlPanel from '../agent/AgentControlPanel';
import Underline from '@tiptap/extension-underline';

/**
 * Custom Style mapping helper
 */
const getBlockStyle = (attrs: any) => {
    const layout = attrs.layout || {};
    const style = attrs.style || {};

    return {
        textAlign: layout.align || 'left',
        lineHeight: layout.lineHeight || 1.5,
        marginTop: layout.spacingBefore || '0',
        marginBottom: layout.spacingAfter || '0',
        padding: style.padding ? `${style.padding.top} ${style.padding.right} ${style.padding.bottom} ${style.padding.left}` : undefined,
        border: style.border && style.border.style !== 'none'
            ? `${style.border.width} ${style.border.style} ${style.border.color}`
            : undefined,
    };
};

const CustomParagraph = Paragraph.extend({
    addAttributes() {
        return {
            layout: { default: {} },
            style: { default: {} },
        };
    },
    renderHTML({ HTMLAttributes }) {
        const styles = getBlockStyle(HTMLAttributes);
        return ['p', { ...HTMLAttributes, style: Object.entries(styles).map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}:${v}`).join(';') }, 0];
    },
});

const CustomHeading = Heading.extend({
    addAttributes() {
        return {
            layout: { default: {} },
            style: { default: {} },
        };
    },
    renderHTML({ node, HTMLAttributes }) {
        const styles = getBlockStyle(HTMLAttributes);
        return [`h${node.attrs.level}`, { ...HTMLAttributes, style: Object.entries(styles).map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}:${v}`).join(';') }, 0];
    },
});

const CustomImage = Image.extend({
    addAttributes() {
        return {
            layout: { default: {} },
        };
    },
    renderHTML({ HTMLAttributes }) {
        const layout = HTMLAttributes.layout || {};
        const style = `width:${layout.width || 'auto'};height:${layout.height || 'auto'};display:${layout.align === 'center' ? 'block' : 'inline-block'};margin:${layout.align === 'center' ? '0 auto' : '0'}`;
        return ['img', { ...HTMLAttributes, style }];
    },
});

const EditorView: React.FC = () => {
    const [editorSelection, setEditorSelection] = useState('');
    const [editorContent, setEditorContent] = useState('');

    const model = useMemo(() => {
        return new DocumentModel({
            blocks: [
                {
                    id: 'block_1',
                    type: 'paragraph',
                    text: 'Upload a DOCX to test advanced formatting preservation!',
                    layout: { align: 'center', spacingAfter: '20px' },
                }
            ],
            page: {
                margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' }
            }
        });
    }, []);

    // Page layout helper
    const pageMargin = model['state']?.page?.margin || { top: '1in', right: '1in', bottom: '1in', left: '1in' };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                paragraph: false,
                heading: false,
            }),
            CustomParagraph,
            CustomHeading,
            CustomImage,
            Underline,
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
        ],
        content: '<p>Loading...</p>',
        editorProps: {
            attributes: {
                class: 'prose focus:outline-none editor-paper',
                style: `
          width: 8.5in;
          min-height: 11in;
          background-color: #ffffff;
          margin: 0 auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding-top: ${pageMargin.top};
          padding-right: ${pageMargin.right};
          padding-bottom: ${pageMargin.bottom};
          padding-left: ${pageMargin.left};
          box-sizing: border-box;
          outline: none;
        `,
            },
        },
    });

    const bridge = useMemo(() => {
        if (!editor) return null;
        return new EditorBridge(editor, model);
    }, [editor, model]);

    useEffect(() => {
        if (bridge) bridge.init();

        if (editor) {
            const updateSelection = () => {
                const { from, to } = editor.state.selection;
                const selectedText = editor.state.doc.textBetween(from, to, ' ');
                setEditorSelection(selectedText);
                setEditorContent(editor.getText());
            };

            editor.on('selectionUpdate', updateSelection);
            updateSelection();

            return () => {
                editor.off('selectionUpdate', updateSelection);
            };
        }
    }, [bridge, editor]);

    if (!editor || !bridge) return <div>Initializing Editor...</div>;

    const editorCommands = {
        applyBold: () => editor.chain().focus().toggleBold().run(),
        applyItalic: () => editor.chain().focus().toggleItalic().run(),
        applyUnderline: () => editor.chain().focus().toggleUnderline().run(),
        convertToBullets: () => editor.chain().focus().toggleBulletList().run(),
        replaceText: (_oldText: string, newText: string) => {
            const { from, to } = editor.state.selection;
            editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, newText).run();
        }
    };

    return (
        <div className="layout-container" style={{ display: 'flex', height: '100%', gap: '20px', padding: '20px', boxSizing: 'border-box' }}>
            <div className="main-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>

                {/* Toolbar */}
                <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', backgroundColor: '#f1f5f9', flexWrap: 'wrap' }}>
                    <button onClick={() => editor.chain().focus().toggleBold().run()} style={buttonStyle}>B</button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} style={buttonStyle}>I</button>
                    <button onClick={() => editor.chain().focus().toggleUnderline().run()} style={buttonStyle}>U</button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={buttonStyle}>H1</button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={buttonStyle}>H2</button>
                    <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} style={buttonStyle}>Table</button>
                </div>

                {/* Scrollable Area */}
                <div className="editor-scroller" style={{
                    flex: 1,
                    overflowY: 'auto',
                    backgroundColor: '#e2e8f0',
                    padding: '50px 0',
                }}>
                    <EditorContent editor={editor} />
                    <div style={{ height: '50px' }} />
                </div>

                {/* Agent Control Panel */}
                <AgentControlPanel 
                    editorSelection={editorSelection}
                    editorContent={editorContent}
                    editorCommands={editorCommands}
                />
            </div>

            <div className="debug-sidebar" style={{ width: '450px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <DebugPanel editor={editor} model={model} bridge={bridge} />
            </div>
        </div>
    );
};

const buttonStyle: React.CSSProperties = { padding: '4px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '13px' };

export default EditorView;