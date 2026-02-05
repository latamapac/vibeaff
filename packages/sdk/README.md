# VibeAff SDK

## CLI
```
vibeaff-init --merchant-id <id> --api-key <key>
```

## SDK Usage
```
const { getTrackingParams } = require("@vibeaff/sdk");
const params = getTrackingParams(window.location.href);
```
