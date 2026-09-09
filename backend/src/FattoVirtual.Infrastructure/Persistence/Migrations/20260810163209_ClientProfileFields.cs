using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ClientProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdditionalNotes",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractCode",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNotes",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "ContractRenewalDate",
                table: "Clients",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Document",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FinanceNotes",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Segment",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServiceWorkNotes",
                table: "Clients",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdditionalNotes",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ContractCode",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ContractNotes",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ContractRenewalDate",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Document",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "FinanceNotes",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Segment",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ServiceWorkNotes",
                table: "Clients");
        }
    }
}
