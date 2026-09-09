using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class WorkspaceTimezoneNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TimeZoneId",
                table: "Clients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "RemindMinutesBefore",
                table: "AgendaEvents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "ReminderCreated",
                table: "AgendaEvents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TimeZoneId",
                table: "AgendaEvents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AppNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Link = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: false),
                    OccursAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    RelatedAgendaEventId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppNotifications_AgendaEvents_RelatedAgendaEventId",
                        column: x => x.RelatedAgendaEventId,
                        principalTable: "AgendaEvents",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AppNotifications_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TimeZoneId = table.Column<string>(type: "text", nullable: false),
                    MenuItems = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPreferences_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_OrganizationId",
                table: "AppNotifications",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_RelatedAgendaEventId",
                table: "AppNotifications",
                column: "RelatedAgendaEventId");

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_UserId_IsRead_OccursAtUtc",
                table: "AppNotifications",
                columns: new[] { "UserId", "IsRead", "OccursAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_UserPreferences_OrganizationId_UserId",
                table: "UserPreferences",
                columns: new[] { "OrganizationId", "UserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppNotifications");

            migrationBuilder.DropTable(
                name: "UserPreferences");

            migrationBuilder.DropColumn(
                name: "TimeZoneId",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "RemindMinutesBefore",
                table: "AgendaEvents");

            migrationBuilder.DropColumn(
                name: "ReminderCreated",
                table: "AgendaEvents");

            migrationBuilder.DropColumn(
                name: "TimeZoneId",
                table: "AgendaEvents");
        }
    }
}
