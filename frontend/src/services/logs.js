import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Função para obter o token de autenticação do localStorage
const getAuthToken = () => localStorage.getItem('token');

// Configurar o axios com o token de autenticação
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Adicionar timeout para evitar requisições pendentes indefinidamente
});

// Adicionar interceptor para incluir o token em todas as requisições
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Adicionar interceptor para tratar respostas e erros
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Melhorar o log de erros para debug
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Erro na resposta da API:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta da API:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição que causou o erro
      console.error('Erro na configuração da requisição:', error.message);
    }
    return Promise.reject(error);
  }
);

// Serviço para gerenciar logs do sistema
export const logService = {
  // Obter logs com filtros e paginação
  async getLogs(params = {}) {
    try {
      console.log('Chamando API para buscar logs:', `${API_URL}/api/logs/`, params);
      const response = await axiosInstance.get('/api/logs/', { params });
      console.log('Resposta da API de logs:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter logs:', error);
      // Melhorar a mensagem de erro para ser mais descritiva
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout na conexão com o servidor. Verifique se o backend está em execução.');
      } else if (!error.response) {
        throw new Error('Erro de rede ao conectar com o servidor. Verifique sua conexão ou se o backend está em execução.');
      }
      throw error;
    }
  },

  // Obter logs do usuário atual
  async getMyLogs(params = {}) {
    try {
      const response = await axiosInstance.get('/api/logs/me', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter logs do usuário:', error);
      throw error;
    }
  },

  // Obter um log específico pelo ID
  async getLogById(logId) {
    try {
      const response = await axiosInstance.get(`/api/logs/${logId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter log ${logId}:`, error);
      throw error;
    }
  },

  // Exportar logs para CSV
  async exportLogs(params = {}) {
    try {
      console.log('Chamando API para exportar logs:', `${API_URL}/api/logs/`, params);
      const response = await axiosInstance.get('/api/logs/', {
        params: { ...params, export: 'csv' },
        responseType: 'blob',
      });

      console.log('Resposta da API de exportação de logs:', response);

      // Criar um link para download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Nome do arquivo
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `system_logs_${date}.csv`);

      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      throw error;
    }
  },

  // Exportar logs em formato específico (CSV, PDF, Excel)
  async exportLogsInFormat(format = 'csv', params = {}) {
    try {
      console.log(`Chamando API para exportar logs em formato ${format}`);

      // Converter os parâmetros para o formato snake_case esperado pela API
      const formattedParams = {};

      // Converter explicitamente todos os parâmetros para o formato snake_case
      if ('startDate' in params) formattedParams.start_date = params.startDate ? new Date(params.startDate).toISOString() : '';
      if ('endDate' in params) formattedParams.end_date = params.endDate ? new Date(params.endDate).toISOString() : '';
      if ('userId' in params) formattedParams.user_id = params.userId || '';
      if ('searchTerm' in params) formattedParams.search_term = params.searchTerm || '';
      if ('level' in params) formattedParams.level = params.level || '';
      if ('category' in params) formattedParams.category = params.category || '';

      // Adicionar o parâmetro de exportação
      formattedParams.export = format;

      console.log('Parâmetros formatados:', formattedParams);

      // Usar o endpoint padrão para logs
      const response = await axiosInstance.get('/api/logs/', {
        params: formattedParams,
        responseType: 'blob',
      });

      // Tipo MIME e extensão de arquivo
      const mimeTypes = {
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf'
      };

      const extensions = {
        csv: 'csv',
        excel: 'xlsx',
        pdf: 'pdf'
      };

      // Criar um link para download do arquivo
      const blob = new Blob([response.data], { type: mimeTypes[format] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Nome do arquivo
      const date = new Date().toISOString().split('T')[0];
      const extension = extensions[format] || format;
      link.setAttribute('download', `system_logs_${date}.${extension}`);

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Limpar URL criada
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error(`Erro ao exportar logs em formato ${format}:`, error);
      throw error;
    }
  },

  // Gerar relatório estatístico dos logs
  async generateStatisticalReport(params = {}) {
    try {
      console.log('Gerando relatório estatístico:', params);

      // Converter os parâmetros para o formato snake_case esperado pela API
      const formattedParams = {};

      // Converter explicitamente todos os parâmetros para o formato snake_case
      if ('startDate' in params) formattedParams.start_date = params.startDate ? new Date(params.startDate).toISOString() : '';
      if ('endDate' in params) formattedParams.end_date = params.endDate ? new Date(params.endDate).toISOString() : '';
      if ('userId' in params) formattedParams.user_id = params.userId || '';
      if ('searchTerm' in params) formattedParams.search_term = params.searchTerm || '';
      if ('level' in params) formattedParams.level = params.level || '';
      if ('category' in params) formattedParams.category = params.category || '';

      console.log('Parâmetros formatados para estatísticas:', formattedParams);

      const response = await axiosInstance.get('/api/logs/statistics', {
        params: formattedParams
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório estatístico:', error);
      throw error;
    }
  },

  // Gerar relatório de resumo por período
  async generateSummaryReport(period = 'daily', params = {}) {
    try {
      console.log(`Gerando relatório de resumo ${period}:`, params);
      const response = await axiosInstance.get('/api/logs/summary', {
        params: { ...params, period }
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao gerar relatório de resumo ${period}:`, error);
      throw error;
    }
  },

  // Programar relatório periódico
  async schedulePeriodicReport(schedule = {}) {
    try {
      const {
        frequency = 'weekly', // daily, weekly, monthly
        format = 'pdf',
        recipients = [],
        filters = {},
        reportName = 'Relatório Periódico de Logs'
      } = schedule;

      console.log('Programando relatório periódico:', schedule);

      // Formatar os filtros para o formato esperado pela API
      const formattedFilters = { ...filters };
      if (formattedFilters.startDate) {
        formattedFilters.start_date = new Date(formattedFilters.startDate).toISOString();
        delete formattedFilters.startDate;
      }
      if (formattedFilters.endDate) {
        formattedFilters.end_date = new Date(formattedFilters.endDate).toISOString();
        delete formattedFilters.endDate;
      }
      if (formattedFilters.userId) {
        formattedFilters.user_id = formattedFilters.userId;
        delete formattedFilters.userId;
      }
      if (formattedFilters.searchTerm) {
        formattedFilters.search_term = formattedFilters.searchTerm;
        delete formattedFilters.searchTerm;
      }

      const response = await axiosInstance.post('/api/logs/schedule-report', {
        frequency,
        format,
        recipients,
        filters: formattedFilters,
        report_name: reportName  // Ajustando para snake_case conforme esperado pela API
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao programar relatório periódico:', error);
      throw error;
    }
  },

  // Listar relatórios programados
  async getScheduledReports() {
    try {
      const response = await axiosInstance.get('/api/logs/scheduled-reports');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter relatórios programados:', error);
      throw error;
    }
  },

  // Cancelar relatório programado
  async cancelScheduledReport(reportId) {
    try {
      const response = await axiosInstance.delete(`/api/logs/scheduled-reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao cancelar relatório programado (ID: ${reportId}):`, error);
      throw error;
    }
  }
};

export default logService;
