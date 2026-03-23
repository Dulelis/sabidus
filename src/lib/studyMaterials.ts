import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Linking, Platform } from 'react-native';

import type { StudyMaterial } from '@/types/app';

export const MATERIAL_LIBRARY_DIRECTORY = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}materials/`
  : null;

function sanitizeFileSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function guessExtensionFromMimeType(mimeType?: string) {
  const normalizedMimeType = mimeType?.trim().toLowerCase();

  if (!normalizedMimeType) {
    return '';
  }

  const extensionMap: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/zip': '.zip',
    'application/json': '.json',
    'text/plain': '.txt',
    'text/html': '.html',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'audio/mpeg': '.mp3',
  };

  return extensionMap[normalizedMimeType] || '';
}

function buildStoredFileName(originalName: string, mimeType?: string) {
  const trimmedName = originalName.trim() || 'material';
  const extensionMatch = /\.[a-zA-Z0-9]{1,8}$/.exec(trimmedName);
  const extension = extensionMatch?.[0] || guessExtensionFromMimeType(mimeType);
  const rawBaseName = extensionMatch
    ? trimmedName.slice(0, Math.max(trimmedName.length - extensionMatch[0].length, 0))
    : trimmedName;
  const sanitizedBaseName = sanitizeFileSegment(rawBaseName) || 'material';

  return `${sanitizedBaseName}-${Date.now()}${extension}`;
}

export function normalizeMaterialUrlInput(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return '';
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith('//')) {
    return `https:${normalizedValue}`;
  }

  if (!normalizedValue.includes(' ') && normalizedValue.includes('.')) {
    return `https://${normalizedValue}`;
  }

  return normalizedValue;
}

export function buildMaterialLabelFromLink(value: string) {
  const normalizedValue = normalizeMaterialUrlInput(value);

  try {
    const parsedUrl = new URL(normalizedValue);
    const pathName = parsedUrl.pathname.split('/').filter(Boolean).pop();

    return pathName ? decodeURIComponent(pathName) : parsedUrl.hostname;
  } catch {
    return normalizedValue || 'material de estudo';
  }
}

export function inferMaterialKindFromUrl(value: string): StudyMaterial['kind'] {
  const normalizedValue = normalizeMaterialUrlInput(value).toLowerCase();

  if (
    normalizedValue.startsWith('file://') ||
    normalizedValue.startsWith('content://') ||
    /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar|txt|epub|mp4|mp3|jpg|jpeg|png|webp)(\?|#|$)/.test(
      normalizedValue
    )
  ) {
    return 'arquivo-externo';
  }

  return 'link';
}

export function getMaterialKindLabel(kind: StudyMaterial['kind']) {
  if (kind === 'arquivo') {
    return 'Arquivo interno';
  }

  if (kind === 'arquivo-externo') {
    return 'Arquivo externo';
  }

  if (kind === 'camera') {
    return 'Captura pela camera';
  }

  return 'Link de estudo';
}

async function ensureMaterialLibraryDirectory() {
  if (!MATERIAL_LIBRARY_DIRECTORY) {
    return null;
  }

  await FileSystem.makeDirectoryAsync(MATERIAL_LIBRARY_DIRECTORY, {
    intermediates: true,
  });

  return MATERIAL_LIBRARY_DIRECTORY;
}

async function storeLocalAsset(options: {
  fallbackTitle: string;
  mimeType?: string;
  originalName: string;
  uri: string;
}) {
  const normalizedMimeType = options.mimeType?.trim() || 'application/octet-stream';

  if (Platform.OS === 'web') {
    return {
      title: options.fallbackTitle,
      url: options.uri,
      mimeType: normalizedMimeType,
      storageMode: 'session' as const,
    };
  }

  const materialDirectory = await ensureMaterialLibraryDirectory();

  if (!materialDirectory) {
    return {
      title: options.fallbackTitle,
      url: options.uri,
      mimeType: normalizedMimeType,
      storageMode: 'session' as const,
    };
  }

  const destinationUri = `${materialDirectory}${buildStoredFileName(
    options.originalName,
    normalizedMimeType
  )}`;

  await FileSystem.copyAsync({
    from: options.uri,
    to: destinationUri,
  });

  return {
    title: options.fallbackTitle,
    url: destinationUri,
    mimeType: normalizedMimeType,
    storageMode: 'persisted' as const,
  };
}

export async function createMaterialFromDocumentAsset(asset: DocumentPicker.DocumentPickerAsset) {
  const fallbackTitle = asset.name?.trim() || 'arquivo-interno';

  return storeLocalAsset({
    fallbackTitle,
    mimeType: asset.mimeType,
    originalName: asset.name || 'arquivo-interno',
    uri: asset.uri,
  });
}

export async function createMaterialFromCameraAsset(asset: ImagePicker.ImagePickerAsset) {
  const fileName = asset.fileName?.trim() || `captura-${Date.now()}.jpg`;

  return storeLocalAsset({
    fallbackTitle: fileName,
    mimeType: asset.mimeType || 'image/jpeg',
    originalName: fileName,
    uri: asset.uri,
  });
}

export async function openStudyMaterialUrl(url: string) {
  const normalizedUrl = normalizeMaterialUrlInput(url);

  if (!normalizedUrl) {
    throw new Error('O material nao possui um endereco valido para abertura.');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  if (/^https?:\/\//i.test(normalizedUrl) || normalizedUrl.startsWith('content://')) {
    await Linking.openURL(normalizedUrl);
    return;
  }

  if (Platform.OS === 'android' && normalizedUrl.startsWith('file://')) {
    const contentUri = await FileSystem.getContentUriAsync(normalizedUrl);
    await Linking.openURL(contentUri);
    return;
  }

  const canOpen = await Linking.canOpenURL(normalizedUrl);

  if (!canOpen) {
    throw new Error('Nenhum aplicativo disponivel para abrir esse material.');
  }

  await Linking.openURL(normalizedUrl);
}

export async function deleteStoredMaterialFile(url: string) {
  if (!MATERIAL_LIBRARY_DIRECTORY || !url.startsWith(MATERIAL_LIBRARY_DIRECTORY)) {
    return;
  }

  await FileSystem.deleteAsync(url, {
    idempotent: true,
  });
}
