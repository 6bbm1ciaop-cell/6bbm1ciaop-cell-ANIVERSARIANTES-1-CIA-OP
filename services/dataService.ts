import { Military } from '../types';

// ===================================================================================
// CONFIGURAÇÃO DA PLANILHA GOOGLE
// ===================================================================================
// ID extraído do link fornecido: 1Xni2knjWjqzRmjUKSNUqQ-Wzi7PYDBvbGn6XRpD-ptI
const SPREADSHEET_ID = '1Xni2knjWjqzRmjUKSNUqQ-Wzi7PYDBvbGn6XRpD-ptI'; 
const SHEET_NAME = 'ANIVERSARIANTES';

// ===================================================================================
// CONFIGURAÇÃO DO GOOGLE APPS SCRIPT (GAS) - ENVIO DE E-MAIL
// ===================================================================================
// A URL abaixo foi fornecida após a implantação do script no Google.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwibWux0yrFkMiqxVm1Xo7cG0l_Nn_Jy_CqN-qDQhk8SbqVNHkmDT0CfTV_IbBj_xincQ/exec';

// ATENÇÃO: ATUALIZE SEU SCRIPT NO GOOGLE COM O CÓDIGO ABAIXO PARA SUPORTAR IMAGENS NO CORPO
/*
// --- START CODE FOR GOOGLE APPS SCRIPT ---
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);
    var recipient = data.to;
    var subject = data.subject;
    var htmlBody = data.body; // Corpo HTML vindo do React
    var imageBase64 = data.image; 

    // Cria o blob da imagem
    var imageBlob = Utilities.newBlob(Utilities.base64Decode(imageBase64), MimeType.JPEG, "cartao.jpg");

    // Configuração de envio com imagem INLINE (cid)
    var emailOptions = {
      to: recipient,
      subject: subject,
      htmlBody: htmlBody, // O React vai mandar <img src="cid:birthdayCard"> no HTML
      inlineImages: {
        birthdayCard: imageBlob // Mapeia o cid "birthdayCard" para o blob
      },
      name: "Comando 1ª Cia Op"
    };

    MailApp.sendEmail(emailOptions);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
// --- END CODE ---
*/

// ===================================================================================

// Mock Data Fallback
const MOCK_DATA: Military[] = [
  { id: '1', name: 'Carlos Eduardo Silva', rank: 'Cb BM', unit: '1ª Cia Op', birthDate: getDateForYear(new Date().getMonth() + 1, new Date().getDate()), bmNumber: '123.456-7' },
  { id: '2', name: 'Ana Maria Souza', rank: 'Sd BM', unit: '2ª Cia Op', birthDate: getDateForYear(new Date().getMonth() + 1, new Date().getDate() + 2), bmNumber: '765.432-1' },
  { id: '3', name: 'Roberto Ferreira', rank: '1º Sgt BM', unit: '1ª Cia Op', birthDate: getDateForYear(new Date().getMonth() + 1, 5), bmNumber: '112.233-4' }
];

export function getDateForYear(month: number, day: number) {
  const year = new Date().getFullYear();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const fetchMilitaryData = async (): Promise<Military[]> => {
  try {
    const encodedSheetName = encodeURIComponent(SHEET_NAME);
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}`;
    
    console.log(`Tentando carregar planilha: ${url}`);
    
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
        throw new Error('A URL retornou HTML em vez de CSV. Provavelmente a planilha não está pública (Acesso Restrito).');
    }

    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
         throw new Error('O CSV retornado está vazio.');
    }

    const data = parseCSV(csvText);
    if (data.length === 0) {
        console.warn("Planilha carregada mas nenhum dado válido encontrado. Usando dados de exemplo.");
        return MOCK_DATA;
    }
    return data;

  } catch (error) {
    console.error("ERRO CRÍTICO AO CARREGAR PLANILHA:", error);
    return MOCK_DATA;
  }
};

const parseCSV = (text: string): Military[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuote = false;
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];
      
      if (char === '"') {
          if (inQuote && nextChar === '"') {
              currentCell += '"'; 
              i++;
          } else {
              inQuote = !inQuote;
          }
      } else if (char === ',' && !inQuote) {
          currentRow.push(currentCell.trim());
          currentCell = '';
      } else if (char === '\n' && !inQuote) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
      } else {
          currentCell += char;
      }
  }
  if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
  }

  if (rows.length < 2) return []; 

  const normalizeHeader = (h: string) => h ? h.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/"/g, '').trim() : '';
  const headers = rows[0].map(normalizeHeader);
  
  const idxName = headers.findIndex(h => h.includes('NOME'));
  const idxRank = headers.findIndex(h => h.includes('POSTO') || h.includes('GRADUACAO'));
  const idxUnit = headers.findIndex(h => h.includes('LOTACAO') || h.includes('OBM') || h.includes('UNIDADE'));
  const idxDate = headers.findIndex(h => h.includes('NASCIMENTO') || h.includes('DATA'));
  const idxBM = headers.findIndex(h => h.includes('NUM') || h.includes('BM'));

  if (idxName === -1 || idxDate === -1) {
      console.error("Colunas obrigatórias 'NOME' ou 'DATA_NASCIMENTO' não encontradas.");
      return [];
  }

  const result: Military[] = [];

  for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue; 

      const name = row[idxName];
      const birthDateRaw = row[idxDate]; 
      
      if (!name || !birthDateRaw) continue;

      let isoDate = '';
      try {
          const cleanDate = birthDateRaw.replace(/"/g, '');
          const parts = cleanDate.split('/');
          if (parts.length >= 2) {
             const day = parts[0].padStart(2, '0');
             const month = parts[1].padStart(2, '0');
             const year = parts.length === 3 ? parts[2] : '2000'; 
             isoDate = `${year}-${month}-${day}`;
          } else {
              isoDate = cleanDate; 
          }
      } catch (e) {
          continue;
      }

      result.push({
          id: `sheet-${i}`,
          name: name.replace(/"/g, ''),
          rank: idxRank !== -1 ? row[idxRank].replace(/"/g, '') : '',
          unit: idxUnit !== -1 ? row[idxUnit].replace(/"/g, '') : 'Indefinido',
          birthDate: isoDate,
          bmNumber: idxBM !== -1 ? row[idxBM].replace(/"/g, '') : '0000000'
      });
  }
  return result;
};

// Funções Auxiliares de Filtro (Mantidas iguais)
export const getBirthdaysByDate = (soldiers: Military[], date: Date): Military[] => {
  return soldiers.filter(s => {
    if (!s.birthDate || s.birthDate.length < 10) return false;
    const parts = s.birthDate.split('-');
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    return month === date.getMonth() + 1 && day === date.getDate();
  });
};

export const getBirthdaysByWeek = (soldiers: Military[], referenceDate: Date): Military[] => {
  const startOfWeek = new Date(referenceDate);
  startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return soldiers.filter(s => {
    if (!s.birthDate) return false;
    const parts = s.birthDate.split('-');
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const birthdayThisYear = new Date(referenceDate.getFullYear(), month, day);
    return birthdayThisYear >= startOfWeek && birthdayThisYear <= endOfWeek;
  });
};

export const getBirthdaysByMonth = (soldiers: Military[], monthIndex: number): Military[] => {
  return soldiers.filter(s => {
    if (!s.birthDate) return false;
    const parts = s.birthDate.split('-');
    const month = parseInt(parts[1]);
    return month === monthIndex + 1;
  });
};

export const filterSoldiers = (soldiers: Military[], filter: string, units: string[]): Military[] => {
  return soldiers.filter(s => {
    const matchesName = s.name.toLowerCase().includes(filter.toLowerCase());
    const matchesUnit = units.length === 0 || units.some(u => s.unit.includes(u));
    return matchesName && matchesUnit;
  });
};

// Função para enviar e-mail via Google Apps Script
export const sendEmailViaGoogleScript = async (
  to: string, 
  subject: string, 
  body: string, 
  imageBase64: string
): Promise<boolean> => {
  
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('COLE_A_URL')) {
    console.error("ERRO: URL do Google Script inválida.");
    return false;
  }

  // Remove o prefixo data:image/jpeg;base64, se existir
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  const payload = {
    to,
    subject,
    body,
    image: cleanBase64
  };

  try {
    console.log(`Enviando requisição para: ${to}`);
    // mode: 'no-cors' é essencial. 
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(payload)
    });
    
    return true;
  } catch (error) {
    console.error("Erro de rede ao enviar e-mail:", error);
    return false;
  }
};