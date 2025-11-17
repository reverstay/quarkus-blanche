// src/types/empresa.ts

export interface EmpresaDTO {
  id: string;
  nome: string;
  criadoEm: string;
  diretoresIds: string[];
}

export interface UnidadeDTO {
  id: string;
  nome: string;
  empresaId: string;
  endereco: string;
  criadoEm: string;
}
