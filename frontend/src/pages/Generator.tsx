/**
 * Contract Generator Page
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { getCategories, generateContract, getGeneratedContractById, type ContractCategory, type Source } from '../api/client';

export default function Generator() {
  const [categories, setCategories] = useState<ContractCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [requirements, setRequirements] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
    
    // Load existing contract if ID is in URL
    const idParam = searchParams.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        loadContract(id);
      }
    }
  }, [searchParams]);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadContract = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await getGeneratedContractById(id);
      setGeneratedText(data.generated_text);
      setSelectedCategory(data.category);
      setRequirements(data.requirements);
      setSources(data.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить договор');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('Не удалось загрузить категории');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !requirements.trim() || loading) return;

    setError('');
    setLoading(true);
    setGeneratedText('');
    setSources([]);

    try {
      await generateContract(
        selectedCategory,
        requirements,
        (chunk) => {
          setGeneratedText((prev) => prev + chunk);
        },
        (_contractId, newSources) => {
          setSources(newSources);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    alert('Договор скопирован в буфер обмена');
  };



  // Parse markdown table into 2D array
  const parseMarkdownTable = (lines: string[]): string[][] | null => {
    if (lines.length < 2) return null;
    
    const rows: string[][] = [];
    for (const line of lines) {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        // Skip separator rows (|---|---|)
        if (/^\|[\s\-:|]+\|$/.test(line.trim())) continue;
        
        const cells = line.split('|')
          .slice(1, -1)  // Remove first and last empty elements
          .map(cell => cell.trim());
        rows.push(cells);
      }
    }
    return rows.length > 0 ? rows : null;
  };

  // Create DOCX table from parsed data with enhanced spacing
  const createDocxTable = (tableData: string[][]) => {
    const borderStyle = {
      style: BorderStyle.SINGLE,
      size: 1,
      color: '000000',
    };
    
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableData.map((row, rowIndex) => 
        new TableRow({
          children: row.map(cell => 
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ 
                  text: cell, 
                  size: 20,
                  bold: rowIndex === 0  // Bold header row
                })],
                spacing: { before: 120, after: 120 },  // Add vertical padding inside cells
              })],
              margins: {
                top: 100,
                bottom: 100,
                left: 100,
                right: 100,
              },
              borders: {
                top: borderStyle,
                bottom: borderStyle,
                left: borderStyle,
                right: borderStyle,
              },
            })
          ),
        })
      ),
    });
  };

  const downloadAsDocx = async () => {
    const lines = generatedText.split('\n');
    const children: (Paragraph | Table)[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // Check if this is the start of a table
      if (line.trim().startsWith('|') && line.includes('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        const tableData = parseMarkdownTable(tableLines);
        if (tableData && tableData.length > 0) {
          // Add space before table
          children.push(new Paragraph({ children: [], spacing: { after: 300 } }));
          children.push(createDocxTable(tableData));
          // Add more space after table
          children.push(new Paragraph({ children: [], spacing: { after: 400 } }));
        }
        continue;
      }

      // Skip empty lines
      if (!line.trim()) {
        i++;
        continue;
      }

      // Check if it's a heading
      if (line.startsWith('# ')) {
        children.push(new Paragraph({
          children: [new TextRun({ text: line.replace('# ', ''), bold: true, size: 32 })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }));
      } else if (line.startsWith('## ')) {
        children.push(new Paragraph({
          children: [new TextRun({ text: line.replace('## ', ''), bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 150 },
        }));
      } else if (line.startsWith('### ')) {
        children.push(new Paragraph({
          children: [new TextRun({ text: line.replace('### ', ''), bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 100 },
        }));
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // List item
        children.push(new Paragraph({
          children: [new TextRun({ text: '• ' + line.substring(2), size: 22 })],
          spacing: { after: 80 },
        }));
      } else if (line.startsWith('---') || line.startsWith('***')) {
        // Horizontal rule - add some spacing
        children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
      } else {
        // Regular paragraph with bold text handling
        const boldRegex = /\*\*(.*?)\*\*/g;
        if (boldRegex.test(line)) {
          const parts: TextRun[] = [];
          let lastIndex = 0;
          const lineForParsing = line;
          lineForParsing.replace(/\*\*(.*?)\*\*/g, (match, text, index) => {
            if (index > lastIndex) {
              parts.push(new TextRun({ text: lineForParsing.substring(lastIndex, index), size: 22 }));
            }
            parts.push(new TextRun({ text, bold: true, size: 22 }));
            lastIndex = index + match.length;
            return match;
          });
          if (lastIndex < lineForParsing.length) {
            parts.push(new TextRun({ text: lineForParsing.substring(lastIndex), size: 22 }));
          }
          children.push(new Paragraph({ children: parts, spacing: { after: 100 } }));
        } else {
          children.push(new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 100 },
          }));
        }
      }
      i++;
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `contract_${selectedCategory.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${Date.now()}.docx`;
    saveAs(blob, fileName);
  };

  return (
    <div className="generator-page">
      <header className="page-header">
        <button onClick={() => navigate('/')} className="btn-back">← Назад</button>
        <h1>📝 Генератор договоров</h1>
      </header>

      <main className="generator-content">
        <form onSubmit={handleSubmit} className="generator-form">
          <div className="form-group">
            <div className="category-header">
              <label>Категория договора</label>
              {!loadingCategories && (
                <div className="search-wrapper">
                  <input 
                    type="text" 
                    placeholder="Поиск категорий..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="category-search"
                  />
                  <span className="search-icon">🔍</span>
                </div>
              )}
            </div>
            {loadingCategories ? (
              <p>Загрузка категорий...</p>
            ) : (
              <div className="category-grid">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    className={`category-btn ${selectedCategory === cat.name ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    <span className="category-icon">{cat.description}</span>
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">{cat.count} шаблонов</span>
                  </button>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="no-results">Категории не найдены</div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Требования к договору</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Опишите стороны, предмет договора, условия, сроки, суммы и другие важные детали..."
              rows={6}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !selectedCategory || requirements.length < 20}
            className="btn-generate"
          >
            {loading ? 'Генерация...' : 'Сгенерировать договор'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {generatedText && (
          <div className="generated-result">
            <div className="result-header">
              <h2>📄 Сгенерированный договор</h2>
              <div className="result-actions">
                <button onClick={copyToClipboard} className="btn-action">
                  📋 Копировать
                </button>
                <button onClick={downloadAsDocx} className="btn-action btn-docx">
                  📥 Скачать DOCX
                </button>
              </div>
            </div>
            <div className="contract-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedText}</ReactMarkdown>
            </div>

            {sources.length > 0 && (
              <details className="sources-expander">
                <summary>📚 Правовая основа ({sources.length})</summary>
                <ul className="sources-list">
                  {sources.map((source, i) => (
                    <li key={i}>
                      <strong>Статья {source.article}</strong> — {source.source}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
