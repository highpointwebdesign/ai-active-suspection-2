import React from 'react';
import TemplatePage from '../components/TemplatePage';

function TemplatePageDemo() {
  return (
    <TemplatePage
      title="Template Page Demo"
      alert="This is an example alert message."
      sections={[
        {
          title: 'Primary Section',
          content: (
            <div>
              <p>This is the main content area. Add your page content here.</p>
            </div>
          ),
          info: (
            <>
              <strong>Instructions:</strong>
              <ul>
                <li>This is a reusable template for new pages.</li>
                <li>Use <b>title</b> and <b>alert</b> props for global page context.</li>
                <li>Use <b>sections</b> to define content with info beneath it.</li>
              </ul>
            </>
          )
        }
      ]}
    >
    </TemplatePage>
  );
}

export default TemplatePageDemo;
