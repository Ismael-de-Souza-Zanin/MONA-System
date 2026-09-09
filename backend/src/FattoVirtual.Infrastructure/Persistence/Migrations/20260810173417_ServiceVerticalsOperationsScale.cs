using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ServiceVerticalsOperationsScale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BrandPrimaryColor",
                table: "Organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultLocale",
                table: "Organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultTimeZoneId",
                table: "Organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "Organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaxAssistants",
                table: "Organizations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxClients",
                table: "Organizations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MarketCountry",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NeedsQuickResponse",
                table: "Clients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PreferredLanguage",
                table: "Clients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ServiceScopes",
                table: "Clients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ServiceVertical",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clients_OrganizationId_ServiceVertical",
                table: "Clients",
                columns: new[] { "OrganizationId", "ServiceVertical" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Clients_OrganizationId_ServiceVertical",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "BrandPrimaryColor",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "DefaultLocale",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "DefaultTimeZoneId",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "MaxAssistants",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "MaxClients",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "MarketCountry",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "NeedsQuickResponse",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PreferredLanguage",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ServiceScopes",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ServiceVertical",
                table: "Clients");
        }
    }
}
