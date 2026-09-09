using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ServiceClientChatAttachmentsWhatsAppReady : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssistantNotes",
                table: "ServiceItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "ServiceItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ClientFacingNotes",
                table: "ServiceItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ServiceItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Specificities",
                table: "ServiceItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsSelf",
                table: "ChatThreads",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "AttachmentId",
                table: "ChatMessages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttachmentKind",
                table: "ChatMessages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AttachmentLabel",
                table: "ChatMessages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttachmentPath",
                table: "ChatMessages",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClientServices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CustomNotes = table.Column<string>(type: "text", nullable: true),
                    AssignedAssistantUserId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientServices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientServices_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientServices_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClientServices_ServiceItems_ServiceItemId",
                        column: x => x.ServiceItemId,
                        principalTable: "ServiceItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientServices_ClientId_ServiceItemId",
                table: "ClientServices",
                columns: new[] { "ClientId", "ServiceItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientServices_OrganizationId",
                table: "ClientServices",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientServices_ServiceItemId",
                table: "ClientServices",
                column: "ServiceItemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientServices");

            migrationBuilder.DropColumn(
                name: "AssistantNotes",
                table: "ServiceItems");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "ServiceItems");

            migrationBuilder.DropColumn(
                name: "ClientFacingNotes",
                table: "ServiceItems");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ServiceItems");

            migrationBuilder.DropColumn(
                name: "Specificities",
                table: "ServiceItems");

            migrationBuilder.DropColumn(
                name: "IsSelf",
                table: "ChatThreads");

            migrationBuilder.DropColumn(
                name: "AttachmentId",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "AttachmentKind",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "AttachmentLabel",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "AttachmentPath",
                table: "ChatMessages");
        }
    }
}
