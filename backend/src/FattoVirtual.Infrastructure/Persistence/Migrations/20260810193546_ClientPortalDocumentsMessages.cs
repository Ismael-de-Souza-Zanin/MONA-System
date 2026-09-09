using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ClientPortalDocumentsMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClientDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ShareLinkId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    StoredName = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    UploadedBy = table.Column<string>(type: "text", nullable: false),
                    UploaderLabel = table.Column<string>(type: "text", nullable: true),
                    UploadedByUserId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientDocuments_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientDocuments_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientDocuments_ShareLinks_ShareLinkId",
                        column: x => x.ShareLinkId,
                        principalTable: "ShareLinks",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ClientPortalMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ShareLinkId = table.Column<Guid>(type: "uuid", nullable: true),
                    Body = table.Column<string>(type: "text", nullable: false),
                    FromContractor = table.Column<bool>(type: "boolean", nullable: false),
                    AuthorLabel = table.Column<string>(type: "text", nullable: false),
                    AuthorUserId = table.Column<string>(type: "text", nullable: true),
                    IsReadByStaff = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientPortalMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientPortalMessages_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientPortalMessages_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientPortalMessages_ShareLinks_ShareLinkId",
                        column: x => x.ShareLinkId,
                        principalTable: "ShareLinks",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientDocuments_ClientId",
                table: "ClientDocuments",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientDocuments_OrganizationId",
                table: "ClientDocuments",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientDocuments_ShareLinkId",
                table: "ClientDocuments",
                column: "ShareLinkId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientPortalMessages_ClientId",
                table: "ClientPortalMessages",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientPortalMessages_OrganizationId",
                table: "ClientPortalMessages",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientPortalMessages_ShareLinkId",
                table: "ClientPortalMessages",
                column: "ShareLinkId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientDocuments");

            migrationBuilder.DropTable(
                name: "ClientPortalMessages");
        }
    }
}
