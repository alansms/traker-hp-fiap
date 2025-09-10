import { utils, write, read } from 'xlsx';

// Função para criar um arquivo Excel de exemplo para importação de vendedores
export const createExampleSellerExcelFile = () => {
  // Dados de exemplo para o arquivo
  const data = [
    {
      'ID': 'SELLER001',
      'HP+ Reseller': 'Sim',
      'Razão Social': 'Distribuidora de Suprimentos Ltda.',
      'CNPJ': '12.345.678/0001-90',
      'Link Loja': 'https://www.mercadolivre.com.br/perfil/DISTRIBSUPRIMENTOS'
    },
    {
      'ID': 'SELLER002',
      'HP+ Reseller': 'Não',
      'Razão Social': 'Tech Informática Comércio Ltda.',
      'CNPJ': '98.765.432/0001-21',
      'Link Loja': 'https://www.mercadolivre.com.br/perfil/TECHINFORMATICA'
    },
    {
      'ID': 'SELLER003',
      'HP+ Reseller': 'Sim',
      'Razão Social': 'HP Distribuidor Oficial S.A.',
      'CNPJ': '45.678.901/0001-23',
      'Link Loja': 'https://www.mercadolivre.com.br/perfil/HPDISTRIBUIDOROFICIAL'
    }
  ];

  // Criar uma nova planilha
  const ws = utils.json_to_sheet(data);

  // Ajustar a largura das colunas
  const wscols = [
    { wch: 15 }, // ID
    { wch: 15 }, // HP+ Reseller
    { wch: 40 }, // Razão Social
    { wch: 20 }, // CNPJ
    { wch: 40 }, // Link Loja
  ];

  ws['!cols'] = wscols;

  // Criar um novo livro e adicionar a planilha
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Vendedores');

  // Gerar o arquivo
  const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });

  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Função para analisar um arquivo Excel de vendedores
export const parseSellerExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: 'array' });

        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para JSON
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

        // Verificar se o cabeçalho está correto
        const header = jsonData[0];
        const expectedHeader = [
          'ID',
          'HP+ Reseller',
          'Razão Social',
          'CNPJ',
          'Link Loja'
        ];

        const isHeaderValid = expectedHeader.every((col, index) =>
          col.toLowerCase() === (header[index] || '').toString().toLowerCase()
        );

        if (!isHeaderValid) {
          reject(new Error('O arquivo Excel não tem o formato esperado. Verifique se as colunas estão corretas.'));
          return;
        }

        // Processar os dados
        const sellers = jsonData.slice(1).map(row => {
          if (!row || row.length < 5) return null;

          return {
            mlId: row[0]?.toString() || '',
            authorized: (row[1]?.toString().toLowerCase() === 'sim') || false,
            name: row[2]?.toString() || '',
            cnpj: row[3]?.toString() || '',
            storeLink: row[4]?.toString() || '',
            reputationScore: 0,
            totalSales: 0,
            productsCount: 0,
            lastUpdate: new Date().toISOString()
          };
        }).filter(Boolean); // Remover valores nulos

        resolve(sellers);
      } catch (error) {
        reject(new Error(`Erro ao processar o arquivo Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};
