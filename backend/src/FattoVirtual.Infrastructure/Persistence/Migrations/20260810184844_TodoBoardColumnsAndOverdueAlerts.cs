using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TodoBoardColumnsAndOverdueAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BoardColumnId",
                table: "TodoItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OverdueNotifiedAtUtc",
                table: "TodoItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "TodoItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "RelatedTodoItemId",
                table: "AppNotifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TodoBoardColumns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Color = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    MarksComplete = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TodoBoardColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TodoBoardColumns_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TodoItems_BoardColumnId",
                table: "TodoItems",
                column: "BoardColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_RelatedTodoItemId",
                table: "AppNotifications",
                column: "RelatedTodoItemId");

            migrationBuilder.CreateIndex(
                name: "IX_TodoBoardColumns_OrganizationId_SortOrder",
                table: "TodoBoardColumns",
                columns: new[] { "OrganizationId", "SortOrder" });

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_TodoItems_RelatedTodoItemId",
                table: "AppNotifications",
                column: "RelatedTodoItemId",
                principalTable: "TodoItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TodoItems_TodoBoardColumns_BoardColumnId",
                table: "TodoItems",
                column: "BoardColumnId",
                principalTable: "TodoBoardColumns",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppNotifications_TodoItems_RelatedTodoItemId",
                table: "AppNotifications");

            migrationBuilder.DropForeignKey(
                name: "FK_TodoItems_TodoBoardColumns_BoardColumnId",
                table: "TodoItems");

            migrationBuilder.DropTable(
                name: "TodoBoardColumns");

            migrationBuilder.DropIndex(
                name: "IX_TodoItems_BoardColumnId",
                table: "TodoItems");

            migrationBuilder.DropIndex(
                name: "IX_AppNotifications_RelatedTodoItemId",
                table: "AppNotifications");

            migrationBuilder.DropColumn(
                name: "BoardColumnId",
                table: "TodoItems");

            migrationBuilder.DropColumn(
                name: "OverdueNotifiedAtUtc",
                table: "TodoItems");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "TodoItems");

            migrationBuilder.DropColumn(
                name: "RelatedTodoItemId",
                table: "AppNotifications");
        }
    }
}
