using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ClientCrmFinanceLedgers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_OrganizationId",
                table: "Payments");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CounterpartyName",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvoiceId",
                table: "Payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ledger",
                table: "Payments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CounterpartyName",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DueDate",
                table: "Invoices",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "Invoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastContactAtUtc",
                table: "Clients",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NextAction",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextActionAtUtc",
                table: "Clients",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelationshipStage",
                table: "Clients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ClientCrmEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    Channel = table.Column<string>(type: "text", nullable: true),
                    FollowUpAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "text", nullable: false),
                    CreatedByName = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientCrmEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientCrmEntries_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientCrmEntries_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_InvoiceId",
                table: "Payments",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_OrganizationId_ClientId_Ledger",
                table: "Payments",
                columns: new[] { "OrganizationId", "ClientId", "Ledger" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientCrmEntries_ClientId_CreatedAt",
                table: "ClientCrmEntries",
                columns: new[] { "ClientId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientCrmEntries_OrganizationId",
                table: "ClientCrmEntries",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Invoices_InvoiceId",
                table: "Payments",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Invoices_InvoiceId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "ClientCrmEntries");

            migrationBuilder.DropIndex(
                name: "IX_Payments_InvoiceId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_OrganizationId_ClientId_Ledger",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CounterpartyName",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DueAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Ledger",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CounterpartyName",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "LastContactAtUtc",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "NextAction",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "NextActionAtUtc",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "RelationshipStage",
                table: "Clients");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_OrganizationId",
                table: "Payments",
                column: "OrganizationId");
        }
    }
}
