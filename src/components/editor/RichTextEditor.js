import React, { useRef } from 'react';
import { Bold, Italic, Underline, List, Link2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const RichTextEditor = ({ content, onChange }) => {
  const editorRef = useRef(null);

  const handleEditorCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="border border-gray-300 rounded-t-md bg-white p-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleEditorCommand('bold')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleEditorCommand('italic')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleEditorCommand('underline')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        {/* More toolbar buttons... */}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="w-full min-h-64 px-3 py-2 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        style={{ minHeight: '200px' }}
        onInput={handleContentChange}
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};
export default RichTextEditor;
