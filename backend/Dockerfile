FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY packages/EmailKit/EmailKit.csproj packages/EmailKit/
COPY packages/WhatsAppKit/WhatsAppKit.csproj packages/WhatsAppKit/
COPY backend/src/FattoVirtual.Domain/FattoVirtual.Domain.csproj backend/src/FattoVirtual.Domain/
COPY backend/src/FattoVirtual.Application/FattoVirtual.Application.csproj backend/src/FattoVirtual.Application/
COPY backend/src/FattoVirtual.Infrastructure/FattoVirtual.Infrastructure.csproj backend/src/FattoVirtual.Infrastructure/
COPY backend/src/FattoVirtual.Api/FattoVirtual.Api.csproj backend/src/FattoVirtual.Api/

RUN dotnet restore backend/src/FattoVirtual.Api/FattoVirtual.Api.csproj

COPY packages/EmailKit/ packages/EmailKit/
COPY packages/WhatsAppKit/ packages/WhatsAppKit/
COPY backend/src/ backend/src/

RUN dotnet publish backend/src/FattoVirtual.Api/FattoVirtual.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV EmailKit__OutboxDirectory=/app/email-outbox
EXPOSE 8080
ENTRYPOINT ["dotnet", "FattoVirtual.Api.dll"]
