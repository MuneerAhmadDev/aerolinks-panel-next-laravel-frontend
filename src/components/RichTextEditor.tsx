// components/RichTextEditor.tsx
'use client';

import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
import { Paper, Typography, Box } from '@mui/material';

// dynamic import with SSR turned off
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
});

interface RichTextEditorProps {
  value: string;
  onChange: (newContent: string) => void;
  label?: string;
}

export default function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const editor = useRef<any>(null);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ '& .jodit-container': { minHeight: 200 } }}>
        <JoditEditor
          ref={editor}
          value={value}
          config={{
            readonly: false,       // all options: https://xdsoft.net/jodit/doc/
            toolbarAdaptive: false, // keeps toolbar fixed
            height: 300,
            askBeforePasteHTML: false,       // don’t prompt before inserting HTML
            // cleanPaste: false,               // don’t strip out tags/styles
            disablePlugins: ['clean-html'],
            processPasteHTML: true,
            defaultActionOnPaste: "insert_as_html",
          }}
          onBlur={(newContent: string) => onChange(newContent)}
        />
      </Box>
    </Paper>
  );
}
