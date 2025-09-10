import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  LightbulbOutlined as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Send as SendIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { analyzeDataWithAI, getAutoInsights, getDataRecommendations } from '../../services/dataAnalysisAI';

const DataAnalysisAI = ({ analysisData }) => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [insights, setInsights] = useState([]);
  const [recommendationsMetric, setRecommendationsMetric] = useState('vendas');
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('insights'); // 'insights', 'analysis', 'recommendations'

  const handleAnalyzeData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await analyzeDataWithAI(analysisData, question);
      setAiAnalysis(response.analysis);
      if (response.insights && response.insights.length > 0) {
        setInsights(response.insights);
      }
      setActiveSection('analysis');
    } catch (err) {
      console.error('Erro ao analisar dados:', err);
      setError(err.message || 'Não foi possível analisar os dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Solicitando insights com dados:', analysisData);
      const response = await getAutoInsights(analysisData);
      console.log('Resposta completa do serviço de insights:', response);

      // Verificando diferentes formatos possíveis de resposta
      const insightsList = response.insights || response.content || response.analysis || [];

      if (Array.isArray(insightsList) && insightsList.length > 0) {
        setInsights(insightsList);
        setActiveSection('insights');
      } else if (typeof response === 'object' && response !== null) {
        // Se a resposta não tem um array de insights, mas é um objeto,
        // tenta converter em um formato de array para exibição
        const formattedInsights = [];

        // Se for uma string, a transforma em um único insight
        if (typeof response.content === 'string' || typeof response.analysis === 'string') {
          const content = response.content || response.analysis || JSON.stringify(response);
          formattedInsights.push({
            title: 'Análise geral',
            content: content
          });
        } else {
          // Transforma as propriedades do objeto em insights individuais
          Object.entries(response).forEach(([key, value]) => {
            if (typeof value === 'string') {
              formattedInsights.push({
                title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                content: value
              });
            }
          });
        }

        if (formattedInsights.length > 0) {
          setInsights(formattedInsights);
          setActiveSection('insights');
        } else {
          throw new Error('Formato de resposta não reconhecido');
        }
      } else {
        throw new Error('Nenhum insight foi retornado pelo serviço');
      }
    } catch (err) {
      console.error('Erro ao gerar insights:', err);
      setError(err.message || 'Não foi possível gerar insights. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDataRecommendations(analysisData, recommendationsMetric);
      setRecommendations(response.insights || []);
      setActiveSection('recommendations');
    } catch (err) {
      console.error('Erro ao gerar recomendações:', err);
      setError(err.message || 'Não foi possível gerar recomendações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const renderInsights = () => (
    <List>
      {insights.length > 0 ? (
        insights.map((insight, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <LightbulbIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary={`Insight ${index + 1}`}
                secondary={insight}
              />
            </ListItem>
            {index < insights.length - 1 && <Divider variant="inset" />}
          </React.Fragment>
        ))
      ) : (
        <ListItem>
          <ListItemText
            primary="Nenhum insight disponível"
            secondary="Clique em 'Gerar Insights' para analisar os dados atuais."
          />
        </ListItem>
      )}
    </List>
  );

  const renderAnalysis = () => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Análise baseada na pergunta: {question || "Análise geral dos dados"}
      </Typography>
      <Box sx={{ mt: 2, whiteSpace: 'pre-line' }}>
        {aiAnalysis || 'Nenhuma análise disponível. Faça uma pergunta e clique em "Analisar Dados".'}
      </Box>
    </Box>
  );

  const renderRecommendations = () => (
    <List>
      {recommendations.length > 0 ? (
        recommendations.map((recommendation, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <BarChartIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={`Recomendação ${index + 1}`}
                secondary={recommendation}
              />
            </ListItem>
            {index < recommendations.length - 1 && <Divider variant="inset" />}
          </React.Fragment>
        ))
      ) : (
        <ListItem>
          <ListItemText
            primary="Nenhuma recomendação disponível"
            secondary={`Clique em 'Gerar Recomendações para ${recommendationsMetric}' para analisar os dados atuais.`}
          />
        </ListItem>
      )}
    </List>
  );

  const renderMetricSelector = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="body1" sx={{ mr: 2 }}>
        Métrica alvo:
      </Typography>
      <Button
        variant={recommendationsMetric === 'vendas' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => setRecommendationsMetric('vendas')}
        sx={{ mr: 1 }}
      >
        Vendas
      </Button>
      <Button
        variant={recommendationsMetric === 'preço' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => setRecommendationsMetric('preço')}
        sx={{ mr: 1 }}
      >
        Preço
      </Button>
      <Button
        variant={recommendationsMetric === 'avaliação' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => setRecommendationsMetric('avaliação')}
      >
        Avaliação
      </Button>
    </Box>
  );

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PsychologyIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h5" component="h2">
          Análise Inteligente de Dados
        </Typography>
        <Tooltip title="Esta ferramenta utiliza inteligência artificial para analisar os dados do dashboard e gerar insights automaticamente.">
          <IconButton size="small" sx={{ ml: 1 }}>
            <HelpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Card sx={{ mb: 3, bgcolor: 'error.light' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Accordion
        expanded={activeSection === 'insights'}
        onChange={() => setActiveSection('insights')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Insights Automáticos</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<LightbulbIcon />}
              onClick={handleGetInsights}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {loading && activeSection === 'insights' ? 'Gerando...' : 'Gerar Insights'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleGetInsights}
              disabled={loading}
            >
              Atualizar
            </Button>
          </Box>
          {loading && activeSection === 'insights' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderInsights()
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={activeSection === 'analysis'}
        onChange={() => setActiveSection('analysis')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Análise Personalizada</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Faça uma pergunta específica sobre os dados..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleAnalyzeData}
              disabled={loading}
            >
              {loading && activeSection === 'analysis' ? 'Analisando...' : 'Analisar'}
            </Button>
          </Box>
          {loading && activeSection === 'analysis' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderAnalysis()
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={activeSection === 'recommendations'}
        onChange={() => setActiveSection('recommendations')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Recomendações Estratégicas</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2 }}>
            {renderMetricSelector()}
            <Button
              variant="contained"
              startIcon={<BarChartIcon />}
              onClick={handleGetRecommendations}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {loading && activeSection === 'recommendations' ? 'Gerando...' : `Gerar Recomendações para ${recommendationsMetric}`}
            </Button>
          </Box>
          {loading && activeSection === 'recommendations' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderRecommendations()
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default DataAnalysisAI;
