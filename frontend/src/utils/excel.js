/**
 * Utilitário para manipulação de arquivos Excel
 * Usado para importação e exportação de produtos
 */
import * as XLSX from 'xlsx';

/**
 * Cria um arquivo Excel de exemplo para importação de produtos
 * @returns {Blob} - Blob contendo o arquivo Excel
 */
export const createExampleExcelFile = () => {
  // Cabeçalhos da planilha
  const headers = [
    'Nome do Produto',
    'Código',
    'Categoria',
    'Preço Atual',
    'Preço de Referência',
    'Vendedor',
    'Produto Autorizado'
  ];

  // Exemplos de dados
  const exampleData = [
    ['Cartucho HP 664XL Preto', 'HP-664XL-BK', 'cartuchos', 89.90, 95.50, 'HP Store', 'Sim'],
    ['Cartucho HP 664XL Colorido', 'HP-664XL-COL', 'cartuchos', 99.90, 105.50, 'HP Store', 'Sim'],
    ['Toner HP 105A', 'HP-105A', 'toners', 259.90, 279.90, 'Distribuidora Exemplo', 'Não'],
    ['Impressora HP Laser 107w', 'HP-107W', 'impressoras', 999.90, 1099.90, 'Magazine XYZ', 'Não'],
  ];

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Criar worksheet com os headers e dados de exemplo
  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

  // Adicionar o worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

  // Converter o workbook para blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

  // Converter o resultado binário para um array buffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }

  // Criar e retornar o blob
  return new Blob([buf], { type: 'application/octet-stream' });
};

/**
 * Analisa um arquivo Excel para extrair dados de produtos
 * @param {File} file - Arquivo Excel a ser analisado
 * @returns {Promise<Array>} - Promessa que resolve para um array de objetos de produto
 */
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Assumir que os dados estão na primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validar que temos pelo menos headers e uma linha de dados
        if (jsonData.length < 2) {
          reject(new Error('Arquivo não contém dados suficientes. Precisa ter cabeçalhos e pelo menos uma linha de dados.'));
          return;
        }

        // Obter cabeçalhos (primeira linha)
        const headers = jsonData[0];

        // Mapear índices de colunas importantes
        const nameIndex = headers.findIndex(h => h?.toLowerCase().includes('nome'));
        const codeIndex = headers.findIndex(h => h?.toLowerCase().includes('código') || h?.toLowerCase().includes('codigo'));
        const categoryIndex = headers.findIndex(h => h?.toLowerCase().includes('categoria'));
        const priceIndex = headers.findIndex(h => h?.toLowerCase().includes('preço atual') || h?.toLowerCase().includes('preco atual'));
        const refPriceIndex = headers.findIndex(h => h?.toLowerCase().includes('referência') || h?.toLowerCase().includes('referencia'));
        const sellerIndex = headers.findIndex(h => h?.toLowerCase().includes('vendedor'));
        const authorizedIndex = headers.findIndex(h => h?.toLowerCase().includes('autorizado'));

        // Verificar se temos as colunas essenciais
        if (nameIndex === -1 || codeIndex === -1 || priceIndex === -1) {
          reject(new Error('Arquivo não contém as colunas obrigatórias: Nome do Produto, Código e Preço Atual'));
          return;
        }

        // Converter dados para o formato de produtos
        const products = [];

        // Começar da segunda linha (índice 1) para pular os cabeçalhos
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];

          // Pular linhas vazias
          if (!row || row.length === 0 || !row[nameIndex]) {
            continue;
          }

          const product = {
            name: row[nameIndex] || '',
            code: row[codeIndex] || '',
            category: categoryIndex !== -1 ? row[categoryIndex] || 'outros' : 'outros',
            currentPrice: priceIndex !== -1 ? Number(row[priceIndex]) || 0 : 0,
            referencePrice: refPriceIndex !== -1 ? Number(row[refPriceIndex]) || 0 : 0,
            seller: sellerIndex !== -1 ? row[sellerIndex] || '' : '',
            authorized: authorizedIndex !== -1 ?
              (typeof row[authorizedIndex] === 'string' ?
                row[authorizedIndex].toLowerCase() === 'sim' ||
                row[authorizedIndex].toLowerCase() === 'yes' ||
                row[authorizedIndex].toLowerCase() === 'true'
                : Boolean(row[authorizedIndex]))
              : false
          };

          // Garantir que preços são números
          product.currentPrice = Number(product.currentPrice);
          product.referencePrice = product.referencePrice ? Number(product.referencePrice) : product.currentPrice;

          // Adicionar produto à lista
          products.push(product);
        }

        resolve(products);
      } catch (error) {
        console.error('Erro ao processar arquivo Excel:', error);
        reject(new Error(`Erro ao processar arquivo Excel: ${error.message}`));
      }
    };

    reader.onerror = (error) => {
      console.error('Erro ao ler arquivo:', error);
      reject(new Error('Erro ao ler o arquivo Excel.'));
    };

    // Ler o arquivo como array buffer
    reader.readAsArrayBuffer(file);
  });
};
