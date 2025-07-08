FROM mcr.microsoft.com/dotnet/runtime:9.0 AS base
WORKDIR /app

# Install basic dependencies for running the application
RUN apt-get update && \
    apt-get install -y ca-certificates curl dos2unix && \
    rm -rf /var/lib/apt/lists/*

# Use the official .NET 9.0 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["PowerOfAttorneyAgent.csproj", "./"]
RUN dotnet restore "PowerOfAttorneyAgent.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
RUN dotnet build "PowerOfAttorneyAgent.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "PowerOfAttorneyAgent.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Add Docker group and configure permissions (only if group doesn't exist)
RUN getent group docker || groupadd -r docker && \
    usermod -aG docker root

# Final stage/image
FROM base AS final
WORKDIR /app

# Copy the published application from the publish stage
COPY --from=publish /app/publish .

# Copy and set permissions for start.sh
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Use the script as the entry point
ENTRYPOINT ["/bin/bash", "/app/start.sh"]