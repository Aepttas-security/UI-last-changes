import { useState, useEffect, useCallback } from 'react';
import { ScannerRepository, DashboardRepository, DashboardMetrics } from '../data/repository';
import { EnrichedAnalysisResult } from '../scanner/ApkScanner';

export function useApkScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScanResult, setLastScanResult] = useState<any | null>(null);
  
  // Dashboard & List states
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [quarantinedFiles, setQuarantinedFiles] = useState<any[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  
  // Alert Popups
  const [activeAlert, setActiveAlert] = useState<any | null>(null);

  // Fetch metrics directly from the cloud database via the backend API
  const refreshData = useCallback(async () => {
    try {
      const metrics = await DashboardRepository.getDashboardMetrics();
      const allScans = await ScannerRepository.listScans();
      const allQuarantine = await ScannerRepository.listQuarantinedApks();
      const allHistory = await ScannerRepository.listScanHistory();
      const alerts = await DashboardRepository.getActiveAlerts();

      setDashboardMetrics(metrics);
      setScans(allScans);
      setQuarantinedFiles(allQuarantine);
      setHistoryLogs(allHistory);

      // Trigger Alert Popup if there are unresolved malicious threats
      if (alerts.length > 0) {
        setActiveAlert(alerts[0]);
      } else {
        setActiveAlert(null);
      }
    } catch (e) {
      console.error('Failed to load database metrics from server:', e);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /**
   * Action: Trigger file scanning
   */
  const scanFile = async (filePath: string) => {
    setIsScanning(true);
    setScanProgress(10);
    
    // Simulate scan progress micro-animations
    const interval = setInterval(() => {
      setScanProgress(p => (p >= 90 ? 90 : p + 20));
    }, 150);

    try {
      const result = await ScannerRepository.scanApk(filePath);
      clearInterval(interval);
      setScanProgress(100);
      setLastScanResult(result);
      await refreshData();
      setIsScanning(false);
      return result;
    } catch (e) {
      clearInterval(interval);
      setIsScanning(false);
      setScanProgress(0);
      console.error('Scan failed:', e);
      throw e;
    }
  };

  /**
   * Action: Quarantine a scanned file
   */
  const quarantineFile = async (scanId: number) => {
    const success = await ScannerRepository.quarantineFile(scanId);
    if (success) {
      await refreshData();
    }
    return success;
  };

  /**
   * Action: Delete file directly from Alert popup
   */
  const deleteFileDirectly = async (scanId: number) => {
    const success = await ScannerRepository.deleteScannedFileDirectly(scanId);
    if (success) {
      await refreshData();
    }
    return success;
  };

  /**
   * Action: Ignore threat
   */
  const ignoreThreat = async (scanId: number) => {
    const success = await ScannerRepository.ignoreThreat(scanId);
    if (success) {
      await refreshData();
    }
    return success;
  };

  /**
   * Action: Restore quarantined file
   */
  const restoreFile = async (quarantineId: number) => {
    const success = await ScannerRepository.restoreFile(quarantineId);
    if (success) {
      await refreshData();
    }
    return success;
  };

  /**
   * Action: Delete permanently
   */
  const deletePermanently = async (quarantineId: number) => {
    const success = await ScannerRepository.deletePermanently(quarantineId);
    if (success) {
      await refreshData();
    }
    return success;
  };

  /**
   * Action: Cloud analysis submission
   */
  const submitForCloudAnalysis = async (quarantineId: number) => {
    const success = await ScannerRepository.submitForAnalysis(quarantineId);
    if (success) {
      await refreshData();
    }
    return success;
  };

  return {
    isScanning,
    scanProgress,
    lastScanResult,
    dashboardMetrics,
    scans,
    quarantinedFiles,
    historyLogs,
    activeAlert,
    scanFile,
    quarantineFile,
    deleteFileDirectly,
    ignoreThreat,
    restoreFile,
    deletePermanently,
    submitForCloudAnalysis,
    refreshData,
  };
}
