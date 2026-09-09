using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CatalogPartnersFaqsContracts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FaqItems_OrganizationId",
                table: "FaqItems");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "FaqItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "FaqItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ClientPartners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    PartnerCompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientPartners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientPartners_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientPartners_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientPartners_PartnerCompanies_PartnerCompanyId",
                        column: x => x.PartnerCompanyId,
                        principalTable: "PartnerCompanies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_OrganizationId_SortOrder",
                table: "FaqItems",
                columns: new[] { "OrganizationId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientPartners_ClientId_PartnerCompanyId",
                table: "ClientPartners",
                columns: new[] { "ClientId", "PartnerCompanyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientPartners_OrganizationId",
                table: "ClientPartners",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientPartners_PartnerCompanyId",
                table: "ClientPartners",
                column: "PartnerCompanyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientPartners");

            migrationBuilder.DropIndex(
                name: "IX_FaqItems_OrganizationId_SortOrder",
                table: "FaqItems");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "FaqItems");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "FaqItems");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_OrganizationId",
                table: "FaqItems",
                column: "OrganizationId");
        }
    }
}
