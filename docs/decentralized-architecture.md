# Decentralized Architecture for PWA Applications

## Overview

The Notes and Budget applications are designed as Progressive Web Applications (PWAs) with a decentralized architecture. This document outlines how these applications integrate with AWS while maintaining decentralization principles.

## Core Principles

1. **Decentralized Identity**
   - Users maintain control of their identity through DIDs
   - No central authentication authority
   - Self-sovereign identity management

2. **P2P Communication**
   - Direct peer-to-peer connections where possible
   - Relay servers for NAT traversal and offline support
   - Optional cloud storage for backup and sync

3. **Data Sovereignty**
   - Users control their encryption keys
   - Data is encrypted end-to-end
   - Optional cloud backup with user-controlled encryption

## Architecture Components

### 1. PWA Infrastructure
**Components**:
- Service Workers for offline functionality
- IndexedDB for local storage
- Web Crypto API for client-side encryption
- WebRTC for P2P connections

**AWS Integration**:
- S3 for static app hosting
- CloudFront for global distribution
- Route 53 for DNS management

### 2. DID Infrastructure
**Components**:
- DID Document storage
- DID Resolution service
- Key management system

**AWS Integration**:
- DynamoDB for DID document storage
- KMS for key management (optional)
- Lambda for DID resolution

### 3. Relay Network
**Components**:
- WebSocket servers for signaling
- STUN/TURN servers for NAT traversal
- Message relay for offline peers

**AWS Integration**:
- API Gateway WebSocket APIs
- Lambda for signaling
- ElastiCache for session management

### 4. Optional Cloud Storage
**Components**:
- Encrypted backup storage
- Sync service
- Conflict resolution

**AWS Integration**:
- S3 for encrypted backups
- DynamoDB for sync metadata
- Lambda for sync processing

## Data Flow

1. **Local-First Architecture**
   ```
   User Device
   ├── Local Storage (IndexedDB)
   ├── Service Worker
   └── Web Crypto API
   ```

2. **P2P Communication**
   ```
   Peer A <-> WebRTC <-> Peer B
   ```

3. **Relay Network**
   ```
   Peer A -> Relay Server -> Peer B
   ```

4. **Cloud Backup**
   ```
   Local Data -> Encrypt -> Cloud Storage
   ```

## Security Model

1. **Identity Management**
   - DIDs for decentralized identity
   - Client-side key generation
   - No central key storage

2. **Data Protection**
   - End-to-end encryption
   - Client-side encryption keys
   - Optional cloud backup with user-controlled keys

3. **Network Security**
   - TLS for all communications
   - WebRTC security features
   - Relay server authentication

## Integration with AWS

### What to Keep
- Static hosting (S3 + CloudFront)
- DNS management (Route 53)
- Monitoring and logging
- Analytics (optional)

### What to Modify
- Remove Cognito (replace with DID)
- Modify DynamoDB for DID storage
- Add WebSocket support
- Implement relay network

### What to Add
- DID resolution service
- WebRTC signaling
- Relay server infrastructure
- Encrypted backup system

## Implementation Guidelines

### 1. PWA Development
```typescript
// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('ServiceWorker registration successful');
    })
    .catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
}

// DID Creation
async function createDID() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["sign", "verify"]
  );
  // Create DID document
  return {
    did: `did:synapsed:${generateUUID()}`,
    publicKey: await exportPublicKey(keyPair),
    privateKey: await exportPrivateKey(keyPair)
  };
}
```

### 2. P2P Communication
```typescript
// WebRTC Connection
class P2PConnection {
  async establishConnection(peerId: string) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.synapsed.me' },
        { urls: 'turn:turn.synapsed.me' }
      ]
    });
    // Setup connection logic
  }
}
```

### 3. Relay Network
```typescript
// WebSocket Connection
class RelayConnection {
  constructor() {
    this.ws = new WebSocket('wss://relay.synapsed.me');
    this.setupEventHandlers();
  }

  async sendMessage(message: EncryptedMessage) {
    await this.ws.send(JSON.stringify(message));
  }
}
```

## Migration Strategy

1. **Phase 1: PWA Foundation**
   - Implement service workers
   - Set up local storage
   - Add offline support

2. **Phase 2: DID Integration**
   - Implement DID creation
   - Add key management
   - Set up DID resolution

3. **Phase 3: P2P Network**
   - Implement WebRTC
   - Add relay servers
   - Enable offline messaging

4. **Phase 4: Cloud Integration**
   - Add encrypted backup
   - Implement sync
   - Enable conflict resolution

## Monitoring and Maintenance

1. **Performance Metrics**
   - P2P connection success rate
   - Relay server latency
   - Storage usage
   - Sync status

2. **Security Monitoring**
   - DID resolution attempts
   - Encryption key rotation
   - Relay server abuse

3. **Cost Optimization**
   - Relay server usage
   - Storage usage
   - Bandwidth consumption

## Recent Improvements

### 1. AWS SDK v3 Migration

- Updated DynamoDB client for DID resolution
- Enhanced Redis connection management
- Improved error handling and type safety
- Better performance and reliability

### 2. Testing Infrastructure

- Added comprehensive WebSocket tests
- Enhanced DID resolution tests
- Improved local storage tests
- Better test coverage

### 3. Code Quality

- Enhanced type safety
- Improved error handling
- Better logging
- Cleaner code organization

## Future Improvements

### 1. P2P Enhancement

- Direct P2P communication
- NAT traversal
- Connection optimization
- Message compression

### 2. Storage Optimization

- Efficient sync algorithms
- Conflict resolution
- Storage compression
- Cache management

### 3. DID Enhancement

- Additional DID methods
- Enhanced verification
- Better key management
- Improved resolution

## Best Practices

### 1. Local Storage

- Regular backups
- Data validation
- Storage limits
- Cleanup procedures

### 2. WebSocket

- Connection management
- Message validation
- Error handling
- Performance monitoring

### 3. DID

- Key rotation
- Document validation
- Resolution caching
- Security practices

## Support

### 1. Troubleshooting

- Common issues
- Resolution steps
- Log analysis
- Performance tuning

### 2. Documentation

- Architecture guide
- API reference
- Examples
- Best practices

### 3. Training

- Architecture overview
- Implementation guide
- Security practices
- Maintenance procedures 