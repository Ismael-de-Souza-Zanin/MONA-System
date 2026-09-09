using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ClientGroupsFlexibleOrg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Clients_OrganizationId_ServiceVertical",
                table: "Clients");

            migrationBuilder.AddColumn<Guid>(
                name: "ClientGroupId",
                table: "Clients",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Clients",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.CreateTable(
                name: "ClientGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientGroups_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clients_ClientGroupId",
                table: "Clients",
                column: "ClientGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_OrganizationId_ClientGroupId",
                table: "Clients",
                columns: new[] { "OrganizationId", "ClientGroupId" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientGroups_OrganizationId_Name",
                table: "ClientGroups",
                columns: new[] { "OrganizationId", "Name" });

            migrationBuilder.AddForeignKey(
                name: "FK_Clients_ClientGroups_ClientGroupId",
                table: "Clients",
                column: "ClientGroupId",
                principalTable: "ClientGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clients_ClientGroups_ClientGroupId",
                table: "Clients");

            migrationBuilder.DropTable(
                name: "ClientGroups");

            migrationBuilder.DropIndex(
                name: "IX_Clients_ClientGroupId",
                table: "Clients");

            migrationBuilder.DropIndex(
                name: "IX_Clients_OrganizationId_ClientGroupId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ClientGroupId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Clients");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_OrganizationId_ServiceVertical",
                table: "Clients",
                columns: new[] { "OrganizationId", "ServiceVertical" });
        }
    }
}
