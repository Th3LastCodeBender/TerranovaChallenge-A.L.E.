FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY	src/Terranova.Api/Terranova.Api.csproj							src/Terranova.Api/
COPY	src/Terranova.Application/Terranova.Application.csproj 			src/Terranova.Application/
COPY	src/Terranova.Domain/Terranova.Domain.csproj 					src/Terranova.Domain/
COPY	src/Terranova.Infrastructure/Terranova.Infrastructure.csproj	src/Terranova.Infrastructure/
RUN		dotnet restore src/Terranova.Api/Terranova.Api.csproj

COPY src/ src/
RUN dotnet publish src/Terranova.Api/Terranova.Api.csproj -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Terranova.Api.dll"]