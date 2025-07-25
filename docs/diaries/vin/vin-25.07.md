# Projekttagebuch – 25.07.2025 – Vin

## Heutige Hauptaufgabe(n) – Was war das Ziel heute?

- Deployment üben und reproduzierbar machen
    
- Loop-It auf EKS deployen mit vollständiger Automatisierung
    
- Präsentation brainstorming
    

---

## Fortschritt & Ergebnisse – Was habe ich konkret geschafft?

- Kompletten EKS Deployment Guide geschrieben und strukturiert
    
- Alle Ressourcen erfolgreich deployed, später gezielt wieder gelöscht
    
- DNS und SSL-Konfiguration getestet
    
- Erste Ideen für die Präsentation gesammelt
    

---

## Herausforderungen & Blockaden – Wo hing ich fest?

- Domain leitete nicht korrekt weiter trotz scheinbar vollständiger Konfiguration
    
- Frontend zeigte altes Verhalten trotz Rebuild
    
- Gesamtzustand des Clusters war schwer überprüfbar, Unsicherheit über "sauberen" Zustand
    
- Erschöpfung führte zu frühzeitigem Destroy
    

---

## Was ich heute gelernt habe – Eine kleine, konkrete Erkenntnis oder neues Wissen:

- Auch eine perfekte Anleitung nützt wenig, wenn einzelne Teile wie DNS oder Ingress unerwartet nicht greifen
    
- Manchmal ist ein vollständiges Reset besser als endloses Debugging
    

---

## Plan für morgen – Was ist der nächste logische Schritt?

- Monitoring Stack (Prometheus/Grafana) für die Präsentation einrichten
    
- Load Testing Szenarien für Demo vorbereiten
    
- Präsentationsablauf strukturieren und üben
    
- Backup/Cleanup Prozeduren testen