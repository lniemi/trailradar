<img src="apps/docs/static/img/logo.svg" alt="TrailRadar Logo" width="75" height="75" align="left" style="margin-right: 10px;">

# TrailRadar

Application for spectating ultra-trail events in real-time. The app displays the location of participants on a map. Spectators can follow specific participants and receive information about their progress. Spectators can also view the event along the route physically and with the help of augmented reality (AR) technology they can orientate themselves and find participants nearby.

****
Media coverage is difficult, expensive, and not possible for every event, especially those in remote regions. This can cause fan disengagement as fans are unable to experience it live.

Our app allows users to follow a race and virtually recreate it. By using simple traking and satellite data, we are able to realistically simulate the race. Users can also customize their view by focusing on any specific athlete.

Key Features:

*   **Map View**: A virtual recreation of the race.
*   **User Focus**: In traditional coverage, only certain athletes are focused on. Our app allows you to change which athlete you focus on.
*   **Live Comments**: Live comments are also supported, allowing for a Twitch-like experience as viewers can cheer on their favourate athletes
*   **Weather simulation**: Simulation includes weather effects for added immersion 
*   **Easy setup**: Setting up only requires us to know the athlestes current position  
  <img width="318" height="458" alt="image" src="https://github.com/user-attachments/assets/32006d2c-813c-461e-9f45-9ebff086e01d" />


---

### Customer Problem & Solution

- Traditional broadcast solutions require cameras and crews, which are expensive and proprietary for each event.
- We provide a cost-effective, accessible virtual coverage platform.
- Validation: We can validate the solution by implementing it and demonstrating the cost savings and increased fan engagement.
- Our X-Factor: Our design is a key differentiator and ability to focus on specific racers

 

### Business Model

- We will have a B2B businesss model and our primary customers will be trail organizers.
- We will 10% of participation fee
* We do not require any high end computation thus costs will not be an issue.


Our users will be:
*   Fans of sports that aren't widely covered.
*   Fans of obscure or difficult-to-visualize sports.

---

## Installation

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 10.0.0 - Install according to the [pnpm documentation](https://pnpm.io/installation). Recommended: `npm install -g pnpm@latest-10`
- **Git**

### Clone the Repository

```bash
git clone https://github.com/lniemi/trailradar.git
cd trailradar
```

### Install Dependencies

```bash
pnpm install
```

This will install all dependencies for all apps and packages in the monorepo.

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
# Supabase (from `supabase start` output)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

#### Getting API Keys

**Mapbox Access Token:**
1. Create an account at [mapbox.com](https://www.mapbox.com/)
2. Navigate to your account's [Access Tokens page](https://account.mapbox.com/access-tokens/)
3. Create a new token or use the default public token

**Supabase Keys:**
When running Supabase locally, the keys are provided in the output of `supabase start`.

### Verify Installation

Run the development server to verify everything is working:

```bash
pnpm dev:spectator
```

The app should be available at [http://localhost:5173](http://localhost:5173).

## Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                  # Run all apps in dev mode
pnpm dev:spectator        # Run spectator app only (port 5173)
pnpm dev:website          # Run website only (port 5174)
pnpm dev:docs             # Run documentation only (port 3000)

# Build
pnpm build                # Build all apps
pnpm build:spectator      # Build spectator app only
pnpm build:website        # Build website only
pnpm build:docs           # Build documentation only

# Other
pnpm lint                 # Lint all packages
pnpm typecheck            # TypeScript type checking
pnpm clean                # Clean all build artifacts

# Supabase
pnpm supabase:start       # Start local Supabase
pnpm supabase:stop        # Stop local Supabase
pnpm supabase:reset       # Reset local database
```